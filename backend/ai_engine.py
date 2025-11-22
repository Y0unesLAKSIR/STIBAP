"""
AI-powered course recommendation engine using sentence transformers
"""
import torch
from sentence_transformers import SentenceTransformer, util
from typing import List, Dict, Any, Optional
import numpy as np
from config import settings
import logging
import os
import ssl
import re
from difflib import SequenceMatcher
from collections import defaultdict

# Disable SSL verification for HuggingFace downloads
os.environ['CURL_CA_BUNDLE'] = ''
os.environ['REQUESTS_CA_BUNDLE'] = ''
ssl._create_default_https_context = ssl._create_unverified_context

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CourseRecommendationEngine:
    """AI engine for course recommendations using semantic similarity"""
    
    # Category mappings: abbreviations and common spellings -> standard names
    CATEGORY_MAPPINGS = {
        # Programming Languages
        'js': 'javascript',
        'javascript': 'javascript',
        'py': 'python',
        'python': 'python',
        'cpp': 'c++',
        'c++': 'c++',
        'ts': 'typescript',
        'typescript': 'typescript',
        'java': 'java',
        'cs': 'c#',
        'csharp': 'c#',
        'c#': 'c#',
        'rb': 'ruby',
        'ruby': 'ruby',
        'php': 'php',
        'go': 'go',
        'golang': 'go',
        'rust': 'rust',
        'swift': 'swift',
        'kotlin': 'kotlin',
        
        # General Categories
        'maths': 'mathematics',
        'math': 'mathematics',
        'mathematics': 'mathematics',
        'mathematic': 'mathematics',
        'matematicas': 'mathematics',
        
        'physics': 'physics',
        'physic': 'physics',
        'phys': 'physics',
        
        'science': 'science',
        'sci': 'science',
        
        'languages': 'languages',
        'language': 'languages',
        'lang': 'languages',
        'langs': 'languages',
        
        # Spoken Languages
        'english': 'english',
        'eng': 'english',
        'en': 'english',
        
        'spanish': 'spanish',
        'español': 'spanish',
        'esp': 'spanish',
        'es': 'spanish',
        
        'french': 'french',
        'français': 'french',
        'fr': 'french',
        
        'german': 'german',
        'deutsch': 'german',
        'de': 'german',
        
        # Other Topics
        'ml': 'machine learning',
        'machinelearning': 'machine learning',
        'machine learning': 'machine learning',
        
        'ai': 'artificial intelligence',
        'artificialintelligence': 'artificial intelligence',
        'artificial intelligence': 'artificial intelligence',
        
        'ds': 'data science',
        'datascience': 'data science',
        'data science': 'data science',
        
        'web dev': 'web development',
        'webdev': 'web development',
        'web development': 'web development',
        
        'mobile dev': 'mobile development',
        'mobiledev': 'mobile development',
        'mobile development': 'mobile development',
        
        'backend': 'backend development',
        'back-end': 'backend development',
        'backend development': 'backend development',
        
        'frontend': 'frontend development',
        'front-end': 'frontend development',
        
        'fullstack': 'full stack development',
        'full-stack': 'full stack development',
        'full stack': 'full stack development',
    }

    @staticmethod
    def _ensure_dict(value: Any) -> Dict[str, Any]:
        """Return a dictionary or an empty dict if value is falsy/non-dict."""
        return value if isinstance(value, dict) else {}

    def __init__(self):
        self.model: Optional[SentenceTransformer] = None
        self.course_embeddings: Optional[torch.Tensor] = None
        self.courses_data: List[Dict[str, Any]] = []
        self.category_names: List[str] = []  # Store actual category names from DB
        self.category_embeddings: Dict[str, torch.Tensor] = {}
        self.difficulty_embeddings: Dict[str, torch.Tensor] = {}
        self._load_model()

    def _load_model(self) -> None:
        """Load the sentence transformer model if it is not already available."""
        if self.model is not None:
            return

        try:
            os.makedirs(settings.model_cache_dir, exist_ok=True)
            self.model = SentenceTransformer(
                settings.model_name,
                cache_folder=settings.model_cache_dir
            )
            logger.info(
                "Loaded sentence transformer model '%s' into memory",
                settings.model_name
            )
        except Exception as load_error:
            logger.error(
                "Failed to load sentence transformer model '%s': %s",
                settings.model_name,
                load_error,
                exc_info=True
            )
            self.model = None

    @staticmethod
    def _normalize_text(value: str) -> str:
        """Collapse whitespace and strip surrounding spaces."""
        if not value:
            return ""
        return re.sub(r"\s+", " ", value).strip()

    def _build_course_text(self, course: Dict[str, Any]) -> str:
        """Compose a single string that represents the course content."""
        text_parts = [
            course.get('title', ''),
            course.get('description', ''),
            course.get('category', {}).get('name', ''),
            course.get('difficulty', {}).get('name', ''),
        ]

        keywords = course.get('keywords') or []
        if isinstance(keywords, list):
            text_parts.extend(keywords)

        learning_outcomes = course.get('learning_outcomes') or []
        if isinstance(learning_outcomes, list):
            text_parts.extend(learning_outcomes)

        combined = " ".join(filter(None, text_parts))
        return self._normalize_text(combined)

    def _fuzzy_match_category(self, token: str) -> Optional[str]:
        """Return the closest category name from the dataset using fuzzy matching."""
        token = (token or "").strip().lower()
        if not token or not self.category_names:
            return None

        best_match: Optional[str] = None
        best_ratio: float = 0.0

        for candidate in self.category_names:
            candidate_normalized = (candidate or "").lower()
            if not candidate_normalized:
                continue

            ratio = SequenceMatcher(None, token, candidate_normalized).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_match = candidate_normalized

        return best_match if best_ratio >= 0.75 else None

    def normalize_category(self, prompt: str) -> str:
        """
        Normalize category terms within the user prompt using alias mapping and fuzzy matching.

        Args:
            prompt: Raw user prompt text.

        Returns:
            Normalized prompt string enriched with canonical category terms.
        """
        if not prompt:
            return ""

        original_prompt = self._normalize_text(prompt)
        normalized_prompt = original_prompt.lower()

        # Apply deterministic alias replacements (e.g., "js" -> "javascript").
        for alias, canonical in self.CATEGORY_MAPPINGS.items():
            pattern = rf"(?<!\w){re.escape(alias)}(?!\w)"
            normalized_prompt = re.sub(pattern, canonical, normalized_prompt)

        # Collect canonical terms to append for better semantic matching.
        canonical_terms = set()
        for word in re.findall(r"[a-z0-9+#]+", normalized_prompt):
            if word in self.CATEGORY_MAPPINGS.values():
                canonical_terms.add(word)
            else:
                fuzzy_match = self._fuzzy_match_category(word)
                if fuzzy_match:
                    canonical_terms.add(fuzzy_match)

        canonical_suffix = " ".join(sorted(canonical_terms))
        if canonical_suffix:
            enriched = f"{normalized_prompt} {canonical_suffix}"
        else:
            enriched = normalized_prompt

        return self._normalize_text(enriched)

    def preprocess_course_data(self, courses: List[Dict[str, Any]]) -> None:
        """
        Preprocess course data fetched from the database and generate embeddings.

        Args:
            courses: List of course dictionaries from database
        """
        logger.info(f"Preprocessing {len(courses)} courses")

        if not isinstance(courses, list):
            logger.warning("Expected list of courses, received %s", type(courses))
            courses = []

        self._load_model()

        if self.model is None:
            logger.error("Sentence transformer model is unavailable; skipping preprocessing")
            self.course_embeddings = None
            self.courses_data = []
            self.category_names = []
            self.category_embeddings = {}
            self.difficulty_embeddings = {}
            return

        sanitized_courses: List[Dict[str, Any]] = []
        course_texts: List[str] = []

        for course in courses:
            course_copy: Dict[str, Any] = dict(course)

            category = self._ensure_dict(course_copy.get('category'))
            difficulty = self._ensure_dict(course_copy.get('difficulty'))
            course_copy['category'] = category
            course_copy['difficulty'] = difficulty

            keywords_raw = course_copy.get('keywords') or []
            if isinstance(keywords_raw, str):
                keywords = [keywords_raw]
            elif isinstance(keywords_raw, list):
                keywords = [k for k in keywords_raw if k]
            else:
                keywords = []
            course_copy['keywords'] = keywords

            learning_outcomes_raw = course_copy.get('learning_outcomes') or []
            if isinstance(learning_outcomes_raw, str):
                learning_outcomes = [learning_outcomes_raw]
            elif isinstance(learning_outcomes_raw, list):
                learning_outcomes = [lo for lo in learning_outcomes_raw if lo]
            else:
                learning_outcomes = []
            course_copy['learning_outcomes'] = learning_outcomes

            sanitized_courses.append(course_copy)

            course_text = self._build_course_text(course_copy)
            course_texts.append(course_text)

        self.courses_data = sanitized_courses

        # Extract unique category names for fuzzy matching
        self.category_names = list({
            course['category'].get('name')
            for course in sanitized_courses
            if course['category'].get('name')
        })
        logger.info(f"Loaded {len(self.category_names)} categories for fuzzy matching")

        if not course_texts:
            logger.warning("No course texts available to encode; skipping embeddings generation")
            self.course_embeddings = None
            return

        # Generate embeddings
        try:
            logger.info("Generating course embeddings...")
            self.course_embeddings = self.model.encode(
                course_texts,
                convert_to_tensor=True,
                show_progress_bar=len(course_texts) > 1
            )
            logger.info("Course embeddings generated successfully")
            self._update_aggregate_embeddings()
        except Exception as encoding_error:
            logger.error("Failed to generate course embeddings: %s", encoding_error, exc_info=True)
            self.course_embeddings = None
            self.category_embeddings = {}
            self.difficulty_embeddings = {}
    
    def get_recommendations(
        self, 
        user_prompt: str, 
        top_k: int = None,
        min_score: float = None,
        difficulty_filter: str = None,
        category_filter: List[str] = None
    ) -> List[Dict]:
        """
        Get course recommendations based on user prompt
        
        Args:
            user_prompt: User's learning goal/interest
            top_k: Number of recommendations to return
            min_score: Minimum confidence score (0-1)
            difficulty_filter: Filter by difficulty level
            category_filter: Filter by category IDs
            
        Returns:
            List of recommended courses with scores
        """
        if not self.model or len(self.courses_data) == 0:
            logger.warning("Model not loaded or no courses available")
            return []

        if not isinstance(self.course_embeddings, torch.Tensor) or self.course_embeddings.numel() == 0:
            logger.warning("Course embeddings are unavailable; cannot generate recommendations")
            return []
        
        top_k = top_k or settings.max_recommendations
        min_score = min_score or settings.min_confidence_score
        
        # Normalize the user prompt (handle abbreviations and spelling mistakes)
        normalized_prompt = self.normalize_category(user_prompt)
        logger.info(f"Original prompt: '{user_prompt}'")
        if normalized_prompt != user_prompt:
            logger.info(f"Normalized prompt: '{normalized_prompt}'")
        
        # Generate embedding for normalized user prompt
        prompt_embedding = self.model.encode(
            normalized_prompt,
            convert_to_tensor=True
        )
        
        # Calculate cosine similarity scores
        cosine_scores = util.cos_sim(prompt_embedding, self.course_embeddings)[0]
        
        # Convert to numpy for easier processing
        scores = cosine_scores.cpu().numpy()
        
        # Get top k indices
        top_indices = np.argsort(scores)[::-1]
        
        # Log all scores for debugging
        logger.info("=" * 60)
        logger.info("Course Similarity Scores:")
        for idx in top_indices[:10]:  # Show top 10 scores
            score = float(scores[idx])
            course = self.courses_data[idx]
            logger.info(f"  [{score:.3f}] {course['title']}")
        logger.info("=" * 60)
        
        # Build recommendations
        recommendations = []
        for idx in top_indices:
            score = float(scores[idx])
            
            # Check minimum score
            if score < min_score:
                logger.info(f"Stopped at score {score:.3f} (below minimum {min_score})")
                break
            
            course = self.courses_data[idx]
            
            # Apply filters
            if difficulty_filter and course.get('difficulty', {}).get('name') != difficulty_filter:
                continue
            
            if category_filter and course.get('category_id') not in category_filter:
                continue
            
            recommendations.append({
                'course': course,
                'confidence_score': score,
                'relevance': self._get_relevance_label(score)
            })
            
            # Stop when we have enough recommendations
            if len(recommendations) >= top_k:
                break
        
        logger.info(f"✓ Generated {len(recommendations)} recommendations (min_score: {min_score})")
        return recommendations
    
    def get_similar_courses(self, course_id: str, top_k: int = 5) -> List[Dict]:
        """
        Find similar courses to a given course
        
        Args:
            course_id: ID of the reference course
            top_k: Number of similar courses to return
            
        Returns:
            List of similar courses with scores
        """
        if not isinstance(self.course_embeddings, torch.Tensor) or self.course_embeddings.numel() == 0:
            logger.warning("Course embeddings are unavailable; cannot compute similar courses")
            return []

        # Find the course index
        course_idx = None
        for idx, course in enumerate(self.courses_data):
            if course['id'] == course_id:
                course_idx = idx
                break
        
        if course_idx is None:
            logger.warning(f"Course {course_id} not found")
            return []
        
        # Get embedding for this course
        course_embedding = self.course_embeddings[course_idx].unsqueeze(0)
        
        # Calculate similarity with all courses
        cosine_scores = util.cos_sim(course_embedding, self.course_embeddings)[0]
        scores = cosine_scores.cpu().numpy()
        
        # Get top k (excluding the course itself)
        top_indices = np.argsort(scores)[::-1][1:top_k+1]
        
        similar_courses = []
        for idx in top_indices:
            similar_courses.append({
                'course': self.courses_data[idx],
                'similarity_score': float(scores[idx])
            })
        
        return similar_courses
    
    def _get_relevance_label(self, score: float) -> str:
        """Convert numerical score to relevance label"""
        if score >= 0.7:
            return "Highly Relevant"
        elif score >= 0.5:
            return "Relevant"
        elif score >= 0.3:
            return "Somewhat Relevant"
        else:
            return "Low Relevance"
    
    def analyze_prompt(
        self,
        prompt: str,
        prompt_context: Optional[Dict[str, Any]] = None,
        max_categories: int = 3,
        max_topics: int = 5
    ) -> Dict:
        """Infer user learning intent using transformer embeddings."""
        if not prompt:
            return {
                'normalized_prompt': '',
                'prompt_length': 0,
                'top_categories': [],
                'top_difficulties': [],
                'detected_topics': [],
                'suggested_difficulty': None,
                'is_specific': False
            }

        self._load_model()

        if self.model is None:
            logger.error("Model unavailable; returning fallback prompt analysis")
            return {
                'normalized_prompt': prompt,
                'prompt_length': len(prompt.split()),
                'top_categories': [],
                'top_difficulties': [],
                'detected_topics': [],
                'suggested_difficulty': None,
                'is_specific': False
            }

        normalized_prompt = self.normalize_category(prompt)

        with torch.no_grad():
            prompt_embedding = self.model.encode(
                normalized_prompt,
                convert_to_tensor=True
            )

        analysis: Dict[str, Any] = {
            'normalized_prompt': normalized_prompt,
            'prompt_length': len(normalized_prompt.split()),
            'top_categories': [],
            'top_difficulties': [],
            'detected_topics': [],
            'suggested_difficulty': None,
            'is_specific': False
        }

        if self.category_embeddings:
            labels = list(self.category_embeddings.keys())
            matrix = torch.stack([self.category_embeddings[label] for label in labels])
            with torch.no_grad():
                scores = util.cos_sim(prompt_embedding, matrix)[0].cpu().numpy()
            top_idx = np.argsort(scores)[::-1][:max_categories]
            for idx in top_idx:
                analysis['top_categories'].append({
                    'name': labels[idx],
                    'score': float(scores[idx])
                })

        if self.difficulty_embeddings:
            labels = list(self.difficulty_embeddings.keys())
            matrix = torch.stack([self.difficulty_embeddings[label] for label in labels])
            with torch.no_grad():
                scores = util.cos_sim(prompt_embedding, matrix)[0].cpu().numpy()
            top_idx = np.argsort(scores)[::-1]
            for idx in top_idx[:max(1, max_categories)]:
                analysis['top_difficulties'].append({
                    'name': labels[idx],
                    'score': float(scores[idx])
                })
            if analysis['top_difficulties']:
                analysis['suggested_difficulty'] = analysis['top_difficulties'][0]['name']

        if isinstance(self.course_embeddings, torch.Tensor) and self.course_embeddings.numel() > 0:
            with torch.no_grad():
                scores = util.cos_sim(prompt_embedding, self.course_embeddings)[0].cpu().numpy()
            top_indices = np.argsort(scores)[::-1][:10]
            topics: List[str] = []
            for idx in top_indices:
                course = self.courses_data[idx]
                for keyword in course.get('keywords') or []:
                    if keyword and keyword.lower() not in topics:
                        topics.append(keyword.lower())
                if not course.get('keywords') and course.get('title'):
                    for word in re.findall(r"[a-zA-Z0-9+#]{3,}", course['title']):
                        lower = word.lower()
                        if lower not in topics:
                            topics.append(lower)
            analysis['detected_topics'] = topics[:max_topics]

        analysis['is_specific'] = (
            len(analysis['detected_topics']) >= 3
            or (analysis['top_categories'] and analysis['top_categories'][0]['score'] >= 0.55)
            or analysis['prompt_length'] >= 12
        )

        if prompt_context:
            analysis['context'] = prompt_context

        return analysis

    def _update_aggregate_embeddings(self) -> None:
        """Aggregate course embeddings for categories and difficulties."""
        if not isinstance(self.course_embeddings, torch.Tensor) or self.course_embeddings.numel() == 0:
            self.category_embeddings = {}
            self.difficulty_embeddings = {}
            return

        category_index_map: Dict[str, List[int]] = defaultdict(list)
        difficulty_index_map: Dict[str, List[int]] = defaultdict(list)

        for idx, course in enumerate(self.courses_data):
            category_name = course.get('category', {}).get('name')
            if category_name:
                category_index_map[category_name].append(idx)

            difficulty_name = course.get('difficulty', {}).get('name')
            if difficulty_name:
                difficulty_index_map[difficulty_name].append(idx)

        self.category_embeddings = self._aggregate_embeddings(category_index_map)
        self.difficulty_embeddings = self._aggregate_embeddings(difficulty_index_map)

    def _aggregate_embeddings(self, index_map: Dict[str, List[int]]) -> Dict[str, torch.Tensor]:
        aggregates: Dict[str, torch.Tensor] = {}
        for label, indices in index_map.items():
            if not indices:
                continue
            vectors = self.course_embeddings[indices]
            mean_vector = vectors if vectors.ndim == 1 else vectors.mean(dim=0)
            norm = torch.norm(mean_vector)
            if torch.isfinite(norm) and norm > 0:
                aggregates[label] = mean_vector / norm
        return aggregates


# Global AI engine instance
ai_engine = CourseRecommendationEngine()
