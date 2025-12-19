"""
FastAPI application for STIBAP Course Recommendation System
"""
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
import logging
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, Request, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import db
from ai_engine import ai_engine
from performance_service import performance_service, PerformanceInput
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

_course_index_lock = asyncio.Lock()


async def ensure_ai_course_index(force: bool = False) -> int:
    """Ensure the AI engine has up-to-date course embeddings."""
    async with _course_index_lock:
        embeddings = ai_engine.course_embeddings
        embeddings_ready = (
            not force
            and ai_engine.courses_data
            and embeddings is not None
            and hasattr(embeddings, "numel")
            and callable(getattr(embeddings, "numel"))
        )

        if embeddings_ready:
            try:
                if embeddings.numel() > 0:
                    return len(ai_engine.courses_data)
            except Exception:
                logger.warning("Failed to inspect course embeddings; rebuilding index", exc_info=True)

        try:
            courses = await db.get_all_courses()
            if not isinstance(courses, list):
                logger.warning("Unexpected course payload from database: %s", type(courses))
                courses = courses or []
            ai_engine.preprocess_course_data(courses)
            return len(ai_engine.courses_data)
        except Exception as index_error:
            logger.error("Failed to refresh AI course index: %s", index_error, exc_info=True)
            raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for the application"""
    # Startup
    logger.info("Starting up STIBAP AI Engine...")
    # try:
    #     # Load all courses and create embeddings
    #     indexed = await ensure_ai_course_index(force=True)
    #     logger.info(f"Indexed {indexed} courses")
    # except Exception as e:
    #     logger.error(f"Error during startup: {e}")
    
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


@app.get("/api/admin/courses")
async def admin_list_courses(request: Request):
    """List all courses for admin panel"""
    try:
        session_token = get_session_token(request)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")

        logger.info("Admin course list request received")

        result = await db.get_all_courses()
        if not isinstance(result, list):
            logger.error(f"Unexpected courses response: {result}")
            raise HTTPException(status_code=500, detail="Invalid response from database")

        return {"success": True, "courses": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing courses: {e}")
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


@app.get("/api/courses/{course_id}/outline")
async def get_course_outline(course_id: str, include_content: bool = True):
    """Return course outline (modules & units). Per request, includes full unit content for all units."""
    try:
        outline = await db.get_course_outline(course_id)
        if not outline:
            raise HTTPException(status_code=404, detail="Course not found")
        # include_content is ignored since we always return full content now, but kept for compatibility
        return {"success": True, "data": outline}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching course outline: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/courses/{course_id}/progress")
async def get_course_progress(request: Request, course_id: str):
    """Return the current user's progress for a course."""
    try:
        session_token = get_session_token(request)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        user = db.get_user_by_session(session_token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid session")
        summary = await db.get_user_course_progress(user_id=user.get('id'), course_id=course_id)
        return {"success": True, "data": summary}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/courses/{course_id}/units/{unit_id}/complete")
async def complete_unit(request: Request, course_id: str, unit_id: str):
    """Mark a unit as completed for the current user and update roll-up progress."""
    try:
        session_token = get_session_token(request)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        user = db.get_user_by_session(session_token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid session")
        result = await db.complete_unit(user_id=user.get('id'), course_id=course_id, unit_id=unit_id)
        if not result.get('success'):
            raise HTTPException(status_code=400, detail=result.get('error', 'Failed to complete unit'))
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing unit: {e}")
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

from qcm_service import qcm_service

# ============================================
# QCM Diagnostic Endpoints
# ============================================

@app.get("/api/qcm/questions")
async def get_questions(subject: str = "Maths_Adv", count: int = 10):
    """
    Get a list of QCM questions for a specific subject.
    Default subject is 'Maths_Adv'.
    """
    questions = await qcm_service.get_questions(subject=subject, count=count)
    return {"success": True, "data": questions}

@app.post("/api/qcm/submit")
async def submit_qcm(answers: dict):
    """Submit QCM answers and get score"""
    # answers format: {"1": 2, "2": 0} where key is question_id, value is selected_index
    result = qcm_service.calculate_score(answers)
    return {"success": True, "data": result}

# ============================================
# Performance Prediction Endpoints
# ============================================

@app.post("/api/performance/predict")
async def predict_performance(input_data: PerformanceInput):
    result = performance_service.predict_performance(input_data)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result


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
        # Analyze the prompt first to enrich context
        prompt_analysis = ai_engine.analyze_prompt(
            prompt=request.prompt,
            prompt_context=request.prompt_context
        )

        # Apply inferred difficulty/category if explicit filters were not provided
        inferred_difficulty = request.difficulty_filter or (
            prompt_analysis.get('suggested_difficulty')
            if prompt_analysis.get('suggested_difficulty') in {
                diff.get('name')
                for diff in prompt_analysis.get('top_difficulties', [])
            }
            else None
        )

        inferred_categories = request.category_filter or [
            category.get('name')
            for category in prompt_analysis.get('top_categories', [])
            if category.get('name')
        ] or None

        results = ai_engine.get_recommendations(
            user_prompt=prompt_analysis.get('normalized_prompt', request.prompt),
            top_k=request.top_k,
            min_score=request.min_score,
            difficulty_filter=inferred_difficulty,
            category_filter=inferred_categories
        )

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
            prompt_analysis=prompt_analysis,
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
        await ensure_ai_course_index()
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
        await ensure_ai_course_index()
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
# Auth & Profile Endpoints
# ============================================

def get_session_token(request):
    """Extract session token from cookie or header"""
    # Try cookie first
    token = request.cookies.get('session_token')
    if token:
        return token
    
    # Try Authorization header
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.replace('Bearer ', '')
    
    # Try custom header
    token = request.headers.get('X-Session-Token')
    if token:
        return token
    
    return None

@app.put("/api/auth/update-profile")
async def update_profile(request: Request, data: dict):
    """Update user profile"""
    try:
        session_token = get_session_token(request)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        result = await db.update_user_profile(
            session_token=session_token,
            full_name=data.get('full_name'),
            bio=data.get('bio'),
            avatar_url=data.get('avatar_url')
        )
        
        logger.info(f"Profile update result: {result}")
        
        # Ensure we return proper response
        if not isinstance(result, dict):
            logger.error(f"Invalid result type: {type(result)}")
            return {"success": False, "error": "Invalid response from database"}
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Exception in update_profile: {type(e).__name__}: {e}")
        return {"success": False, "error": "Failed to update profile"}

@app.post("/api/auth/change-password")
async def change_password(request: Request, data: dict):
    """Change user password"""
    try:
        session_token = get_session_token(request)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        result = await db.change_user_password(
            session_token=session_token,
            old_password=data.get('old_password'),
            new_password=data.get('new_password')
        )
        
        logger.info(f"Password change result: {result}")
        
        # Ensure we return proper response
        if not isinstance(result, dict):
            logger.error(f"Invalid result type: {type(result)}")
            return {"success": False, "error": "Invalid response from database"}
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Exception in change_password: {type(e).__name__}: {e}")
        return {"success": False, "error": "Failed to change password"}

@app.get("/api/auth/me")
async def get_current_user(request: Request):
    """Get current user info"""
    try:
        session_token = get_session_token(request)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user = await db.get_user_by_session(session_token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        return {"success": True, "user": user}
    except Exception as e:
        logger.error(f"Error getting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Admin Endpoints
# ============================================

@app.get("/api/admin/users")
async def get_all_users(request: Request):
    """Get all users (admin only)"""
    try:
        session_token = get_session_token(request)
        if not session_token:
            logger.error("No session token found")
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        logger.info(f"Admin request with token: {session_token[:20]}...")
        result = await db.admin_get_all_users(session_token)
        
        if not result.get('success'):
            logger.error(f"Admin check failed: {result.get('error')}")
            raise HTTPException(status_code=403, detail=result.get('error', 'Unauthorized'))
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/users/{user_id}")
async def update_user(request: Request, user_id: str, data: dict):
    """Update user (admin only)"""
    try:
        session_token = get_session_token(request)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        logger.info(f"Updating user {user_id} with data: {data}")
        
        result = await db.admin_update_user(
            session_token=session_token,
            target_user_id=user_id,
            full_name=data.get('full_name'),
            email=data.get('email'),
            role=data.get('role'),
            is_active=data.get('is_active')
        )
        
        logger.info(f"Update result from DB: {result}")
        logger.info(f"Result type: {type(result)}, success value: {result.get('success')}")
        
        if not result.get('success'):
            logger.error(f"Update failed with result: {result}")
            raise HTTPException(status_code=403, detail=result.get('error', 'Unauthorized'))
        
        logger.info(f"Returning successful result: {result}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Exception in update_user endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/courses/import")
async def import_course(
    request: Request,
    file: UploadFile = File(...),
    course_id: Optional[str] = Query(default=None)
):
    """Import or update a course via structured archive upload (admin only)."""
    try:
        session_token = get_session_token(request)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")

        if file.content_type not in {"application/zip", "application/x-zip-compressed", "application/octet-stream"}:
            logger.warning(f"Invalid content type for course import: {file.content_type}")
            raise HTTPException(status_code=400, detail="Upload must be a ZIP archive")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp_file:
            tmp_path = Path(tmp_file.name)
            tmp_file.write(await file.read())

        try:
            result = await db.import_course_package(
                session_token=session_token,
                archive_path=tmp_path,
                course_id=course_id
            )
        finally:
            try:
                tmp_path.unlink()
            except FileNotFoundError:
                pass

        if not isinstance(result, dict):
            logger.error(f"Course import returned invalid response: {result}")
            raise HTTPException(status_code=500, detail="Invalid response from database")

        if not result.get('success'):
            logger.error(f"Course import failed: {result}")
            raise HTTPException(status_code=400, detail=result.get('error', 'Failed to import course'))

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Exception during course import: {e}")
        raise HTTPException(status_code=500, detail="Course import failed")


@app.put("/api/admin/courses/{course_id}/category")
async def update_course_category(request: Request, course_id: str, data: dict):
    """Update a course's category (admin only)."""
    try:
        session_token = get_session_token(request)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")

        category_id = data.get('category_id') if isinstance(data, dict) else None
        if not category_id:
            raise HTTPException(status_code=400, detail="category_id is required")

        result = await db.admin_update_course_category(
            session_token=session_token,
            course_id=course_id,
            category_id=category_id
        )

        if not result.get('success'):
            raise HTTPException(status_code=400, detail=result.get('error', 'Failed to update course category'))

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating course category: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/reload-courses")
async def reload_courses():
    """Reload courses and regenerate embeddings (admin only)"""
    try:
        courses = await db.get_all_courses()
        if not isinstance(courses, list):
            logger.warning("Unexpected course payload when reloading: %s", type(courses))
            courses = courses or []

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
