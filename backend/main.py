"""
FastAPI application for STIBAP Course Recommendation System
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import logging

from config import settings
from database import db
from ai_engine import ai_engine
from models import (
    RecommendationRequest,
    RecommendationResponse,
    CourseRecommendation,
    UserPreferencesCreate,
    UserPreferencesUpdate,
    CourseProgressUpdate,
    OnboardingCompleteRequest,
    HealthResponse
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for the application"""
    # Startup
    logger.info("Starting up STIBAP AI Engine...")
    try:
        # Load all courses and create embeddings
        courses = await db.get_all_courses()
        ai_engine.preprocess_course_data(courses)
        logger.info(f"Indexed {len(courses)} courses")
    except Exception as e:
        logger.error(f"Error during startup: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")


app = FastAPI(
    title="STIBAP AI Course Recommender",
    description="AI-powered course recommendation system",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Health Check
# ============================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        model_loaded=ai_engine.model is not None,
        courses_indexed=len(ai_engine.courses_data)
    )


# ============================================
# Categories Endpoints
# ============================================

@app.get("/api/categories")
async def get_categories():
    """Get all categories"""
    try:
        categories = await db.get_all_categories()
        return {"success": True, "data": categories}
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/categories/main")
async def get_main_categories():
    """Get main categories (top-level)"""
    try:
        categories = await db.get_main_categories()
        return {"success": True, "data": categories}
    except Exception as e:
        logger.error(f"Error fetching main categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/categories/{category_id}/subcategories")
async def get_subcategories(category_id: str):
    """Get subcategories of a category"""
    try:
        subcategories = await db.get_subcategories(category_id)
        return {"success": True, "data": subcategories}
    except Exception as e:
        logger.error(f"Error fetching subcategories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Difficulty Levels Endpoints
# ============================================

@app.get("/api/difficulties")
async def get_difficulties():
    """Get all difficulty levels"""
    try:
        difficulties = await db.get_difficulty_levels()
        return {"success": True, "data": difficulties}
    except Exception as e:
        logger.error(f"Error fetching difficulties: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Courses Endpoints
# ============================================

@app.get("/api/courses")
async def get_courses(category_id: str = None):
    """Get all courses or filter by category"""
    try:
        if category_id:
            courses = await db.get_courses_by_category(category_id)
        else:
            courses = await db.get_all_courses()
        return {"success": True, "data": courses}
    except Exception as e:
        logger.error(f"Error fetching courses: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/courses/{course_id}")
async def get_course(course_id: str):
    """Get a specific course"""
    try:
        course = await db.get_course_by_id(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        return {"success": True, "data": course}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching course: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/courses/{course_id}/similar")
async def get_similar_courses(course_id: str, top_k: int = 5):
    """Get similar courses"""
    try:
        similar = ai_engine.get_similar_courses(course_id, top_k)
        return {"success": True, "data": similar}
    except Exception as e:
        logger.error(f"Error finding similar courses: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# AI Recommendation Endpoints
# ============================================

@app.post("/api/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Get AI-powered course recommendations"""
    try:
        # Check for cached recommendations
        cached = await db.get_cached_recommendation(request.user_id, request.prompt)
        
        if cached:
            # Return cached recommendations
            course_ids = cached['recommended_courses']
            courses = []
            for course_id in course_ids:
                course = await db.get_course_by_id(course_id)
                if course:
                    courses.append(course)
            
            recommendations = [
                CourseRecommendation(
                    course_id=course['id'],
                    title=course['title'],
                    description=course['description'],
                    category=course.get('category', {}),
                    difficulty=course.get('difficulty', {}),
                    duration_minutes=course.get('duration_minutes'),
                    confidence_score=cached['confidence_scores'].get(course['id'], 0.5),
                    relevance="Cached",
                    keywords=course.get('keywords', []),
                    learning_outcomes=course.get('learning_outcomes', [])
                )
                for course in courses
            ]
            
            return RecommendationResponse(
                recommendations=recommendations,
                total_found=len(recommendations),
                prompt_analysis={},
                cached=True
            )
        
        # Generate new recommendations
        results = ai_engine.get_recommendations(
            user_prompt=request.prompt,
            top_k=request.top_k,
            min_score=request.min_score,
            difficulty_filter=request.difficulty_filter,
            category_filter=request.category_filter
        )
        
        # Analyze the prompt
        analysis = ai_engine.analyze_prompt(request.prompt)
        
        # Format recommendations
        recommendations = []
        confidence_scores = {}
        course_ids = []
        
        for result in results:
            course = result['course']
            score = result['confidence_score']
            
            recommendations.append(CourseRecommendation(
                course_id=course['id'],
                title=course['title'],
                description=course['description'],
                category=course.get('category', {}),
                difficulty=course.get('difficulty', {}),
                duration_minutes=course.get('duration_minutes'),
                confidence_score=score,
                relevance=result['relevance'],
                keywords=course.get('keywords', []),
                learning_outcomes=course.get('learning_outcomes', [])
            ))
            
            course_ids.append(course['id'])
            confidence_scores[course['id']] = score
        
        # Cache the recommendations
        if recommendations:
            await db.save_recommendation(
                user_id=request.user_id,
                prompt=request.prompt,
                recommended_courses=course_ids,
                confidence_scores=confidence_scores
            )
        
        return RecommendationResponse(
            recommendations=recommendations,
            total_found=len(recommendations),
            prompt_analysis=analysis,
            cached=False
        )
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# User Preferences Endpoints
# ============================================

@app.get("/api/users/{user_id}/preferences")
async def get_user_preferences(user_id: str):
    """Get user preferences"""
    try:
        preferences = await db.get_user_preferences(user_id)
        return {"success": True, "data": preferences}
    except Exception as e:
        logger.error(f"Error fetching preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/users/{user_id}/preferences")
async def create_user_preferences(user_id: str, preferences: UserPreferencesCreate):
    """Create user preferences"""
    try:
        result = await db.create_user_preferences(user_id, preferences.dict())
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Error creating preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/users/{user_id}/preferences")
async def update_user_preferences(user_id: str, preferences: UserPreferencesUpdate):
    """Update user preferences"""
    try:
        result = await db.update_user_preferences(
            user_id, 
            {k: v for k, v in preferences.dict().items() if v is not None}
        )
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Error updating preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/users/{user_id}/complete-onboarding")
async def complete_onboarding(request: OnboardingCompleteRequest):
    """Complete onboarding process"""
    try:
        # Create or update preferences
        existing = await db.get_user_preferences(request.user_id)
        
        if existing:
            await db.update_user_preferences(
                request.user_id,
                {**request.preferences.dict(), 'onboarding_completed': True}
            )
        else:
            await db.create_user_preferences(
                request.user_id,
                {**request.preferences.dict(), 'onboarding_completed': True}
            )
        
        # Get initial recommendations based on learning goals
        recommendations = ai_engine.get_recommendations(
            user_prompt=request.preferences.learning_goals,
            top_k=10
        )
        
        return {
            "success": True,
            "message": "Onboarding completed successfully",
            "recommendations": recommendations[:5]  # Return top 5
        }
        
    except Exception as e:
        logger.error(f"Error completing onboarding: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# User Progress Endpoints
# ============================================

@app.get("/api/users/{user_id}/progress")
async def get_user_progress(user_id: str):
    """Get user's course progress"""
    try:
        progress = await db.get_user_progress(user_id)
        return {"success": True, "data": progress}
    except Exception as e:
        logger.error(f"Error fetching progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/users/{user_id}/progress")
async def update_progress(user_id: str, progress: CourseProgressUpdate):
    """Update course progress"""
    try:
        result = await db.update_course_progress(
            user_id,
            progress.course_id,
            {
                'status': progress.status,
                'progress_percentage': progress.progress_percentage,
                'started_at': datetime.utcnow().isoformat() if progress.status != 'not_started' else None,
                'completed_at': datetime.utcnow().isoformat() if progress.status == 'completed' else None
            }
        )
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Error updating progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/users/{user_id}/recommendations")
async def get_user_recommendations(user_id: str, top_k: int = 10):
    """Get user's personalized recommendations based on their preferences"""
    try:
        # Get user preferences
        preferences = await db.get_user_preferences(user_id)
        
        if not preferences or not preferences.get('learning_goals'):
            # No preferences found, return empty
            return {"success": True, "data": []}
        
        # Generate recommendations based on learning goals
        results = ai_engine.get_recommendations(
            user_prompt=preferences['learning_goals'],
            top_k=top_k,
            difficulty_filter=None  # Could filter by preferred_difficulty_id
        )
        
        # Format response with full course details
        recommendations = []
        for result in results:
            recommendations.append({
                'course': result['course'],
                'confidence_score': result['confidence_score']
            })
        
        return {"success": True, "data": recommendations}
        
    except Exception as e:
        logger.error(f"Error fetching user recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Admin Endpoints
# ============================================

@app.post("/api/admin/reload-courses")
async def reload_courses():
    """Reload courses and regenerate embeddings (admin only)"""
    try:
        courses = await db.get_all_courses()
        ai_engine.preprocess_course_data(courses)
        return {
            "success": True,
            "message": f"Reloaded {len(courses)} courses",
            "courses_indexed": len(courses)
        }
    except Exception as e:
        logger.error(f"Error reloading courses: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload
    )
