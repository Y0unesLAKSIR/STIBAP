# Quick Backend Startup Guide

## The Issue
Your React app (port 3000) is running, but the Python backend (port 8000) is not started.

Error: `Failed to fetch` means the frontend can't connect to http://localhost:8000

## Solution: Start the Backend

### Step 1: Open a NEW Terminal/Command Prompt

**Keep your React app running in the current terminal!**

Open a second terminal window.

---

### Step 2: Navigate to Backend Directory

```bash
cd C:\Users\F\IdeaProjects\STIBAP\backend
```

---

### Step 3: Check if Python is Installed

```bash
python --version
```

Should show: `Python 3.8+`

If not installed:
- Download from https://www.python.org/downloads/
- Make sure to check "Add Python to PATH" during installation

---

### Step 4: Create Virtual Environment (First Time Only)

```bash
python -m venv venv
```

This creates a `venv` folder in the backend directory.

---

### Step 5: Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

You should see `(venv)` at the start of your terminal prompt.

---

### Step 6: Install Dependencies (First Time Only)

```bash
pip install -r requirements.txt
```

This will take 5-10 minutes (PyTorch is large ~700MB).

**Progress:**
```
Collecting fastapi...
Collecting torch...
Collecting transformers...
...
Successfully installed 30+ packages
```

---

### Step 7: Configure Environment Variables

Create a `.env` file in the `backend` folder:

**File: `backend/.env`**
```env
SUPABASE_URL=https://ibrcdwgyocvqkogxhnqh.supabase.co
SUPABASE_KEY=your_supabase_service_role_key_here
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=True
CORS_ORIGINS=http://localhost:3000
MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
MODEL_CACHE_DIR=./models
MIN_CONFIDENCE_SCORE=0.3
MAX_RECOMMENDATIONS=10
```

**Important:** Replace `your_supabase_service_role_key_here` with your actual key:
1. Go to https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy the **service_role** key (NOT the anon key)

---

### Step 8: Start the Backend Server

```bash
python main.py
```

**Expected Output:**
```
INFO:     Starting up STIBAP AI Engine...
INFO:     Loading model: sentence-transformers/all-MiniLM-L6-v2
INFO:     Model loaded successfully
INFO:     Preprocessing 6 courses
INFO:     Generating course embeddings...
Batches: 100%|███████| 1/1 [00:00<00:00, 5.23it/s]
INFO:     Course embeddings generated successfully
INFO:     Indexed 6 courses
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**First Run:** Model will download (~90MB). Subsequent runs are instant.

---

### Step 9: Verify Backend is Running

Open browser: http://localhost:8000/health

Should see:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-08T...",
  "model_loaded": true,
  "courses_indexed": 6
}
```

---

### Step 10: Test the Onboarding

Now go back to your React app: http://localhost:3000

1. Login/Register
2. Go through onboarding
3. Difficulty levels should now load! ✅

---

## Common Issues

### Issue 1: "python: command not found"
**Solution:** Install Python from https://www.python.org/downloads/

### Issue 2: "No module named 'fastapi'"
**Solution:** 
```bash
# Make sure venv is activated
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Issue 3: "Port 8000 already in use"
**Solution:** 
```bash
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process or change port in backend/.env
API_PORT=8001
```

Then update frontend `.env`:
```env
REACT_APP_API_URL=http://localhost:8001
```

### Issue 4: "Connection refused" after starting backend
**Solution:**
- Check if backend is actually running (should show Uvicorn logs)
- Verify port 8000 in backend logs
- Check CORS_ORIGINS includes http://localhost:3000

### Issue 5: Model download fails
**Solution:**
- Check internet connection
- Model downloads to `./models` folder
- Size: ~90MB
- Retry: Delete `./models` folder and restart

### Issue 6: Database errors
**Solution:**
- Run `supabase_courses_schema.sql` in Supabase SQL Editor
- Verify SUPABASE_KEY is the **service_role** key
- Check SUPABASE_URL is correct

---

## Quick Checklist

- [ ] Python 3.8+ installed
- [ ] Virtual environment created (`venv` folder exists)
- [ ] Virtual environment activated (shows `(venv)`)
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created with Supabase keys
- [ ] Backend started (`python main.py`)
- [ ] Backend health check works (http://localhost:8000/health)
- [ ] Frontend can connect (no more "Failed to fetch")

---

## Both Running Successfully

**Terminal 1 (Frontend):**
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.56.1:3000
```

**Terminal 2 (Backend):**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345]
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Now test onboarding - it should work!** 🎉

---

## Pro Tips

1. **Keep both terminals open** while developing
2. **Backend auto-reloads** when you edit Python files (thanks to `API_RELOAD=True`)
3. **Check logs** in backend terminal for API requests
4. **API Documentation** available at http://localhost:8000/docs
5. **Use `CTRL+C`** to stop servers

---

## Need Help?

1. Check backend terminal for error messages
2. Check browser console (F12) for frontend errors
3. Visit http://localhost:8000/docs to test API directly
4. Verify database setup in Supabase
