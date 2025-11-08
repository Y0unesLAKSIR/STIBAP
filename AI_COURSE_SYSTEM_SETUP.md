# AI Course Recommendation System - Setup Guide

## 🎓 Overview

You now have a complete AI-powered course recommendation system that:
- ✅ Suggests courses based on user prompts using **sentence transformers**
- ✅ Has an interactive **onboarding flow** for new users
- ✅ Stores categories, courses, difficulties, and user preferences
- ✅ Uses **FastAPI + Python backend** with AI engine
- ✅ **React frontend** with beautiful UI
- ✅ Automatically checks onboarding status

---

## 📋 Quick Start Checklist

### Step 1: Database Setup
- [ ] Run `supabase_courses_schema.sql` in Supabase SQL Editor
- [ ] Verify tables created: categories, courses, difficulty_levels, user_preferences, etc.
- [ ] Check that sample data is inserted

### Step 2: Backend Setup
- [ ] Install Python dependencies
- [ ] Configure environment variables
- [ ] Run the FastAPI server

### Step 3: Frontend Setup
- [ ] Add API URL to environment
- [ ] Install dependencies (if needed)
- [ ] Start React app

### Step 4: Test the System
- [ ] Register a new user
- [ ] Go through onboarding
- [ ] Get AI recommendations

---

## 🗃️ Step 1: Database Setup

### Run the SQL Schema

1. Open Supabase Dashboard: https://app.supabase.com
2. Go to **SQL Editor** → **New Query**
3. Copy the entire content from `supabase_courses_schema.sql`
4. Click **Run**

### What Gets Created:

**Tables:**
- `categories` - Subject categories (Languages, Science, Math, Physics)
- `difficulty_levels` - Beginner, Intermediate, Advanced
- `courses` - All available courses with keywords
- `user_preferences` - User onboarding data
- `user_course_progress` - Track learning progress
- `ai_recommendations` - Cache recommendations

**Sample Data:**
- 4 main categories + 20+ subcategories
- 3 difficulty levels
- 6+ sample courses
- All with keywords for AI matching

### Verify Installation:

Run this query to check:
```sql
SELECT COUNT(*) as count, 'categories' as table_name FROM categories
UNION ALL
SELECT COUNT(*), 'courses' FROM courses
UNION ALL
SELECT COUNT(*), 'difficulty_levels' FROM difficulty_levels;
```

You should see courses and categories.

---

## 🐍 Step 2: Backend Setup

### Navigate to Backend Directory

```bash
cd backend
```

### Create Python Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- FastAPI & Uvicorn (web server)
- Transformers & PyTorch (AI models)
- Sentence Transformers (semantic search)
- Supabase client
- And more...

**Note:** This may take 5-10 minutes. PyTorch is large!

### Configure Environment

Create `.env` file in `backend/` directory:

```env
# Supabase Configuration
SUPABASE_URL=https://ibrcdwgyocvqkogxhnqh.supabase.co
SUPABASE_KEY=your_supabase_service_role_key_here

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=True

# CORS Origins
CORS_ORIGINS=http://localhost:3000

# AI Model
MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
MODEL_CACHE_DIR=./models

# Recommendation Settings
MIN_CONFIDENCE_SCORE=0.3
MAX_RECOMMENDATIONS=10
```

**Important:** Get your Supabase **service role key** (not anon key):
1. Supabase Dashboard → Settings → API
2. Copy "service_role" key
3. Paste in `.env` file

### Start the Backend

```bash
python main.py
```

You should see:
```
INFO:     Starting up STIBAP AI Engine...
INFO:     Loading model: sentence-transformers/all-MiniLM-L6-v2
INFO:     Model loaded successfully
INFO:     Indexed 6 courses
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**First Run:** Model downloads (~90MB). Subsequent runs are instant.

### Test the Backend

Open browser: http://localhost:8000/health

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-08T...",
  "model_loaded": true,
  "courses_indexed": 6
}
```

**API Documentation:** http://localhost:8000/docs (Interactive Swagger UI)

---

## ⚛️ Step 3: Frontend Setup

### Add Backend API URL

Copy the example file:
```bash
cd frontend
copy .env.example .env    # Windows
cp .env.example .env      # Mac/Linux
```

Edit `.env` and add your Supabase keys + backend URL:
```env
REACT_APP_SUPABASE_URL=https://ibrcdwgyocvqkogxhnqh.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
REACT_APP_API_URL=http://localhost:8000
```

### Install Dependencies (if not already done)

```bash
npm install
```

### Start React App

```bash
npm start
```

App opens at: http://localhost:3000

---

## 🧪 Step 4: Test the System

### 1. Register a New User

1. Go to http://localhost:3000/register
2. Fill in:
   - Full Name (optional)
   - Email
   - Password
3. Click "Sign Up"

### 2. Login

1. Go to http://localhost:3000/login
2. Enter your credentials
3. Click "Sign In"

### 3. Onboarding Flow

You'll be automatically redirected to `/onboarding`:

**Step 1 - Learning Goals:**
- Enter: "I want to learn Python for data science and machine learning"
- Click "Next"

**Step 2 - Skill Level:**
- Select: "Intermediate"
- Click "Next"

**Step 3 - Categories:**
- Select: "Languages", "Mathematics", "Science"
- Click "Next"

**Step 4 - Time Availability:**
- Select: "1 hour/day"
- Click "Complete Setup"

**Step 5 - Recommendations:**
- AI analyzes your prompt
- Shows matching courses with confidence scores
- Click "Start Learning"

### 4. Dashboard

You'll land on the `/home` page:
- Personalized welcome message
- Feature cards
- (Future: Your recommended courses here)

---

## 📊 How It Works

### AI Recommendation Engine

**Technology:** Sentence Transformers (all-MiniLM-L6-v2)

**Process:**
1. User enters: "I want to learn Python for data science"
2. AI converts to semantic embedding (vector)
3. Compares with all course embeddings
4. Returns top matches with confidence scores

**What Gets Embedded:**
- Course title
- Description
- Category name
- Keywords
- Learning outcomes

**Matching:** Cosine similarity between vectors

### Onboarding Check

When user tries to access `/home`:
1. `OnboardingCheck` component checks `user_preferences` table
2. If `onboarding_completed = false` or no record → redirect to `/onboarding`
3. If `onboarding_completed = true` → allow access

### Data Flow

```
User Input → React (Onboarding)
    ↓
FastAPI Backend (/api/recommendations)
    ↓
AI Engine (sentence_transformers)
    ↓
Cosine Similarity Calculation
    ↓
Top Matches → Save to DB → Return to Frontend
```

---

## 🎨 Customization

### Add More Courses

In Supabase SQL Editor:

```sql
INSERT INTO public.courses (
    title, 
    description, 
    category_id, 
    difficulty_id, 
    duration_minutes, 
    keywords, 
    learning_outcomes
) VALUES (
    'Your Course Title',
    'Detailed description of the course content',
    (SELECT id FROM categories WHERE name = 'Python'),
    (SELECT id FROM difficulty_levels WHERE name = 'Beginner'),
    300,
    ARRAY['python', 'programming', 'web'],
    ARRAY['Learn Python basics', 'Build web apps']
);
```

Then reload courses in backend:
```bash
curl -X POST http://localhost:8000/api/admin/reload-courses
```

### Add More Categories

```sql
INSERT INTO public.categories (name, description, icon, parent_id) VALUES
('Machine Learning', 'AI and ML concepts', '🤖', (SELECT id FROM categories WHERE name = 'Science'));
```

### Change AI Model

In `backend/.env`:
```env
# Smaller, faster model
MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2

# Larger, more accurate model
MODEL_NAME=sentence-transformers/all-mpnet-base-v2

# Multilingual model
MODEL_NAME=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
```

Restart backend after changing.

---

## 🔧 Troubleshooting

### Backend Won't Start

**Error:** `ModuleNotFoundError: No module named 'transformers'`
- **Fix:** Activate venv and run `pip install -r requirements.txt`

**Error:** `Connection refused to Supabase`
- **Fix:** Check `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- **Fix:** Use **service_role** key, not anon key

**Error:** `Port 8000 already in use`
- **Fix:** Change `API_PORT=8001` in `.env`
- **Fix:** Update frontend `.env`: `REACT_APP_API_URL=http://localhost:8001`

### Frontend Issues

**Error:** `API request failed`
- **Fix:** Ensure backend is running on port 8000
- **Fix:** Check CORS_ORIGINS in backend `.env` includes `http://localhost:3000`

**Stuck on onboarding:**
- **Fix:** Manually mark as complete in Supabase:
```sql
UPDATE user_preferences 
SET onboarding_completed = true 
WHERE user_id = 'your-user-id';
```

### AI Not Working

**Error:** `Model not loaded or no courses available`
- **Fix:** Backend needs courses from database
- **Fix:** Check backend logs for "Indexed X courses"
- **Fix:** Run SQL schema to insert sample courses

**Low quality recommendations:**
- **Fix:** Add more keywords to courses
- **Fix:** Write better course descriptions
- **Fix:** Try larger AI model

---

## 📚 API Endpoints

### Categories
- `GET /api/categories` - All categories
- `GET /api/categories/main` - Top-level categories
- `GET /api/categories/{id}/subcategories` - Subcategories

### Courses
- `GET /api/courses` - All courses
- `GET /api/courses?category_id={id}` - Filter by category
- `GET /api/courses/{id}` - Single course
- `GET /api/courses/{id}/similar` - Similar courses

### AI Recommendations
- `POST /api/recommendations` - Get recommendations
  ```json
  {
    "prompt": "I want to learn Python",
    "user_id": "uuid",
    "top_k": 10,
    "min_score": 0.3
  }
  ```

### User Preferences
- `GET /api/users/{id}/preferences` - Get preferences
- `POST /api/users/{id}/preferences` - Create preferences
- `PUT /api/users/{id}/preferences` - Update preferences
- `POST /api/users/{id}/complete-onboarding` - Finish onboarding

### Admin
- `POST /api/admin/reload-courses` - Reload and re-index courses

Full docs: http://localhost:8000/docs

---

## 🚀 Next Steps

### Recommended Enhancements

1. **Show Recommendations on Dashboard**
   - Fetch and display recommended courses on `/home`
   - Add "Start Course" buttons

2. **Course Detail Pages**
   - Create `/course/:id` route
   - Show full course information
   - Track progress

3. **Search Functionality**
   - Add search bar
   - Real-time AI search

4. **User Profile**
   - Edit preferences
   - View learning history
   - Statistics

5. **Course Progress Tracking**
   - Mark lessons complete
   - Progress bar
   - Certificates

6. **More AI Features**
   - Learning path generation
   - Adaptive difficulty
   - Prerequisite checking

---

## 📁 Project Structure

```
STIBAP/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── ai_engine.py         # AI recommendation engine
│   ├── database.py          # Supabase operations
│   ├── models.py            # Pydantic models
│   ├── config.py            # Configuration
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Onboarding.js      # Onboarding flow
│   │   │   ├── OnboardingCheck.js  # Onboarding guard
│   │   │   └── ... (existing components)
│   │   ├── services/
│   │   │   └── apiClient.js       # Backend API client
│   │   └── App.js                 # Updated with routes
│   └── .env                 # Frontend environment
│
├── supabase_custom_auth.sql      # Auth schema
├── supabase_courses_schema.sql   # Courses schema
└── AI_COURSE_SYSTEM_SETUP.md    # This file
```

---

## ✅ Success Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Database tables created with sample data
- [ ] Can register and login
- [ ] Onboarding flow works
- [ ] AI recommendations generate
- [ ] User sees personalized courses

---

## 🎉 You're All Set!

Your AI-powered course recommendation system is complete and ready to use!

**Test Flow:**
1. Register → Login
2. Complete Onboarding (4 steps)
3. Get AI Recommendations
4. Land on Dashboard

**Backend:** http://localhost:8000
**Frontend:** http://localhost:3000
**API Docs:** http://localhost:8000/docs

Enjoy building your learning platform! 🚀
