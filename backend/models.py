"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class UserPreferencesCreate(BaseModel):
    """Model for creating user preferences"""
    learning_goals: str
    preferred_difficulty_id: Optional[str] = None
    preferred_categories: Optional[List[str]] = []
    time_availability_minutes: Optional[int] = None


class UserPreferencesUpdate(BaseModel):
    """Model for updating user preferences"""
    learning_goals: Optional[str] = None
    preferred_difficulty_id: Optional[str] = None
    preferred_categories: Optional[List[str]] = None
    time_availability_minutes: Optional[int] = None
    onboarding_completed: Optional[bool] = None


class RecommendationRequest(BaseModel):
    """Model for recommendation request"""
    prompt: str = Field(..., min_length=10, max_length=1000)
    user_id: str
    top_k: Optional[int] = Field(default=10, ge=1, le=50)
    min_score: Optional[float] = Field(default=0.3, ge=0.0, le=1.0)
    difficulty_filter: Optional[str] = None
    category_filter: Optional[List[str]] = None
    prompt_context: Optional[Dict[str, Any]] = None


class CourseRecommendation(BaseModel):
    """Model for course recommendation response"""
    course_id: str
    title: str
    description: str
    category: Dict[str, Any]
    difficulty: Dict[str, Any]
    duration_minutes: Optional[int]
    confidence_score: float
    relevance: str
    keywords: Optional[List[str]] = []
    learning_outcomes: Optional[List[str]] = []


class RecommendationResponse(BaseModel):
    """Model for recommendation response"""
    recommendations: List[CourseRecommendation]
    total_found: int
    prompt_analysis: Dict[str, Any]
    cached: bool = False


class CourseProgressUpdate(BaseModel):
    """Model for updating course progress"""
    course_id: str
    status: str = Field(..., pattern="^(not_started|in_progress|completed)$")
    progress_percentage: int = Field(..., ge=0, le=100)


class OnboardingCompleteRequest(BaseModel):
    """Model for completing onboarding"""
    user_id: str
    preferences: UserPreferencesCreate


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: datetime
    model_loaded: bool
    courses_indexed: int
