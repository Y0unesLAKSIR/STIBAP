"""
AI-powered course recommendation engine using sentence transformers
"""
import torch
from sentence_transformers import SentenceTransformer, util
from typing import List, Dict, Tuple
import numpy as np
from config import settings
import logging
import os
import ssl
import re
from difflib import SequenceMatcher

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
        'frontend development': 'frontend development',
        
        'fullstack': 'full stack development',
        'full-stack': 'full stack development',
        'full stack': 'full stack development',
    }
    
    def __init__(self):
        self.model = None
        self.course_embeddings = {}
        self.courses_data = []
        self.category_names = []  # Store actual category names from DB
        self.load_model()
    
    def load_model(self):
        """Load the sentence transformer model"""
        try:
            logger.info(f"Loading model: {settings.model_name}")
            logger.info("This may take a few minutes on first run (downloading ~90MB)...")
            
            self.model = SentenceTransformer(
                settings.model_name,
                cache_folder=settings.model_cache_dir
            )
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            logger.error("\n" + "="*60)
            logger.error("MODEL DOWNLOAD FAILED!")
            logger.error("="*60)
            logger.error("This is likely due to SSL/network issues.")
            logger.error("\nSOLUTION: Run this command first:")
            logger.error("    python download_model.py")
            logger.error("\nThis will download the model with SSL workarounds.")
            logger.error("Then run 'python main.py' again.")
            logger.error("="*60 + "\n")
            raise
    
    def normalize_category(self, text: str) -> str:
        """
        Normalize category names by handling abbreviations and spelling mistakes
        
        Args:
            text: Input text with potential category names
            
        Returns:
            Normalized text with standardized category names
        """
        text_lower = text.lower()
        normalized_text = text
        
        # First, try exact mapping from CATEGORY_MAPPINGS
        words = re.findall(r'\b\w+\b', text_lower)
        for word in words:
            if word in self.CATEGORY_MAPPINGS:
                standard_name = self.CATEGORY_MAPPINGS[word]
                # Replace in original text (case-insensitive)
                normalized_text = re.sub(
                    rf'\b{re.escape(word)}\b',
                    standard_name,
                    normalized_text,
                    flags=re.IGNORECASE
                )
                logger.info(f"Mapped '{word}' → '{standard_name}'")
        
        # Second, use fuzzy matching for potential spelling mistakes
        if self.category_names:
            for word in words:
                if word not in self.CATEGORY_MAPPINGS and len(word) > 3:
                    best_match, best_score = self._find_closest_category(word)
                    # If similarity > 75%, consider it a match
                    if best_score > 0.75 and best_match:
                        normalized_text = re.sub(
                            rf'\b{re.escape(word)}\b',
                            best_match,
                            normalized_text,
                            flags=re.IGNORECASE
                        )
                        logger.info(f"Fuzzy matched '{word}' → '{best_match}' (score: {best_score:.2f})")
        
        return normalized_text
    
    def _find_closest_category(self, word: str) -> Tuple[str, float]:
        """
        Find the closest matching category name using fuzzy matching
        
        Args:
            word: Word to match
            
        Returns:
            Tuple of (best_match, similarity_score)
        """
        best_match = None
        best_score = 0
        
        word_lower = word.lower()
        
        for category in self.category_names:
            category_lower = category.lower()
            # Calculate similarity
            similarity = SequenceMatcher(None, word_lower, category_lower).ratio()
            
            if similarity > best_score:
                best_score = similarity
                best_match = category
        
        return best_match, best_score
    
    def preprocess_course_data(self, courses: List[Dict]):
        """
        Preprocess courses and create embeddings
        
        Args:
            courses: List of course dictionaries from database
        """
        logger.info(f"Preprocessing {len(courses)} courses")
        self.courses_data = courses
        
        # Extract unique category names for fuzzy matching
        self.category_names = list(set(
            course.get('category', {}).get('name', '')
            for course in courses
            if course.get('category', {}).get('name')
        ))
        logger.info(f"Loaded {len(self.category_names)} categories for fuzzy matching")
        
        # Create rich text representations of courses
        course_texts = []
        for course in courses:
            # Combine all relevant text fields
            text_parts = [
                course['title'],
                course['description'],
                course.get('category', {}).get('name', ''),
                course.get('difficulty', {}).get('name', ''),
            ]
            
            # Add keywords if available
            if course.get('keywords'):
                text_parts.extend(course['keywords'])
            
            # Add learning outcomes
            if course.get('learning_outcomes'):
                text_parts.extend(course['learning_outcomes'])
            
            # Combine all parts
            course_text = ' '.join(filter(None, text_parts))
            course_texts.append(course_text)
        
        # Generate embeddings
        logger.info("Generating course embeddings...")
        self.course_embeddings = self.model.encode(
            course_texts,
            convert_to_tensor=True,
            show_progress_bar=True
        )
        logger.info("Course embeddings generated successfully")
    
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
    
    def analyze_prompt(self, prompt: str) -> Dict:
        """
        Analyze user prompt to extract learning intents
        
        Args:
            prompt: User's input
            
        Returns:
            Dictionary with analysis results
        """
        prompt_lower = prompt.lower()
        
        # Keywords for difficulty detection
        beginner_keywords = ['beginner', 'start', 'basic', 'introduction', 'learn', 'new to']
        intermediate_keywords = ['intermediate', 'improve', 'advance', 'deeper', 'better']
        advanced_keywords = ['advanced', 'expert', 'master', 'deep dive', 'complex']
        
        # Detect suggested difficulty
        suggested_difficulty = "Intermediate"  # Default
        if any(keyword in prompt_lower for keyword in beginner_keywords):
            suggested_difficulty = "Beginner"
        elif any(keyword in prompt_lower for keyword in advanced_keywords):
            suggested_difficulty = "Advanced"
        
        # Extract potential topics (simple keyword extraction)
        topics = []
        course_keywords = set()
        for course in self.courses_data:
            if course.get('keywords'):
                course_keywords.update([k.lower() for k in course['keywords']])
        
        for keyword in course_keywords:
            if keyword in prompt_lower:
                topics.append(keyword)
        
        return {
            'suggested_difficulty': suggested_difficulty,
            'detected_topics': topics[:5],  # Top 5
            'prompt_length': len(prompt.split()),
            'is_specific': len(topics) > 2
        }


# Global AI engine instance
ai_engine = CourseRecommendationEngine()
