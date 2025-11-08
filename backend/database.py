"""
Database connection and operations
"""
from supabase import create_client, Client
from config import settings
from typing import List, Dict, Optional, Any


class Database:
    """Supabase database wrapper"""
    
    def __init__(self):
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_key
        )
    
    # Categories
    async def get_all_categories(self) -> List[Dict]:
        """Get all categories with hierarchy"""
        response = self.client.table('categories').select('*').execute()
        return response.data
    
    async def get_main_categories(self) -> List[Dict]:
        """Get top-level categories (no parent)"""
        response = self.client.table('categories')\
            .select('*')\
            .is_('parent_id', 'null')\
            .execute()
        return response.data
    
    async def get_subcategories(self, parent_id: str) -> List[Dict]:
        """Get subcategories of a parent category"""
        response = self.client.table('categories')\
            .select('*')\
            .eq('parent_id', parent_id)\
            .execute()
        return response.data
    
    # Difficulty Levels
    async def get_difficulty_levels(self) -> List[Dict]:
        """Get all difficulty levels"""
        response = self.client.table('difficulty_levels')\
            .select('*')\
            .order('level')\
            .execute()
        return response.data
    
    # Courses
    async def get_all_courses(self) -> List[Dict]:
        """Get all active courses"""
        response = self.client.table('courses')\
            .select('*, category:categories(*), difficulty:difficulty_levels(*)')\
            .eq('is_active', True)\
            .execute()
        return response.data
    
    async def get_courses_by_category(self, category_id: str) -> List[Dict]:
        """Get courses in a specific category"""
        response = self.client.table('courses')\
            .select('*, category:categories(*), difficulty:difficulty_levels(*)')\
            .eq('category_id', category_id)\
            .eq('is_active', True)\
            .execute()
        return response.data
    
    async def get_course_by_id(self, course_id: str) -> Optional[Dict]:
        """Get a specific course"""
        response = self.client.table('courses')\
            .select('*, category:categories(*), difficulty:difficulty_levels(*)')\
            .eq('id', course_id)\
            .single()\
            .execute()
        return response.data
    
    # User Preferences
    async def get_user_preferences(self, user_id: str) -> Optional[Dict]:
        """Get user preferences"""
        response = self.client.table('user_preferences')\
            .select('*')\
            .eq('user_id', user_id)\
            .execute()
        return response.data[0] if response.data else None
    
    async def create_user_preferences(self, user_id: str, preferences: Dict) -> Dict:
        """Create user preferences"""
        data = {
            'user_id': user_id,
            **preferences
        }
        response = self.client.table('user_preferences')\
            .insert(data)\
            .execute()
        return response.data[0]
    
    async def update_user_preferences(self, user_id: str, preferences: Dict) -> Dict:
        """Update user preferences"""
        response = self.client.table('user_preferences')\
            .update(preferences)\
            .eq('user_id', user_id)\
            .execute()
        return response.data[0]
    
    async def complete_onboarding(self, user_id: str) -> Dict:
        """Mark onboarding as completed"""
        response = self.client.table('user_preferences')\
            .update({'onboarding_completed': True})\
            .eq('user_id', user_id)\
            .execute()
        return response.data[0]
    
    # User Course Progress
    async def get_user_progress(self, user_id: str) -> List[Dict]:
        """Get all course progress for a user"""
        response = self.client.table('user_course_progress')\
            .select('*, course:courses(*)')\
            .eq('user_id', user_id)\
            .execute()
        return response.data
    
    async def update_course_progress(
        self, 
        user_id: str, 
        course_id: str, 
        progress: Dict
    ) -> Dict:
        """Update course progress"""
        # Check if progress exists
        existing = self.client.table('user_course_progress')\
            .select('*')\
            .eq('user_id', user_id)\
            .eq('course_id', course_id)\
            .execute()
        
        if existing.data:
            # Update existing
            response = self.client.table('user_course_progress')\
                .update(progress)\
                .eq('user_id', user_id)\
                .eq('course_id', course_id)\
                .execute()
        else:
            # Insert new
            data = {
                'user_id': user_id,
                'course_id': course_id,
                **progress
            }
            response = self.client.table('user_course_progress')\
                .insert(data)\
                .execute()
        
        return response.data[0]
    
    # AI Recommendations
    async def save_recommendation(
        self, 
        user_id: str, 
        prompt: str, 
        recommended_courses: List[str],
        confidence_scores: Dict
    ) -> Dict:
        """Save AI recommendation to cache"""
        data = {
            'user_id': user_id,
            'prompt': prompt,
            'recommended_courses': recommended_courses,
            'confidence_scores': confidence_scores
        }
        response = self.client.table('ai_recommendations')\
            .insert(data)\
            .execute()
        return response.data[0]
    
    async def get_cached_recommendation(
        self, 
        user_id: str, 
        prompt: str
    ) -> Optional[Dict]:
        """Get cached recommendation if available"""
        response = self.client.table('ai_recommendations')\
            .select('*')\
            .eq('user_id', user_id)\
            .eq('prompt', prompt)\
            .gt('expires_at', 'now()')\
            .order('created_at', desc=True)\
            .limit(1)\
            .execute()
        return response.data[0] if response.data else None


# Global database instance
db = Database()
