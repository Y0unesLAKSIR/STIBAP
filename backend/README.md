# STIBAP Backend - AI Course Recommendation System

FastAPI backend with AI-powered course recommendations using sentence transformers.

## ✅ Status: IMPLEMENTED

## Tech Stack

- **FastAPI** - Modern Python web framework
- **Sentence Transformers** - AI semantic search
- **PyTorch** - Deep learning framework
- **Supabase Python Client** - Database integration
- **Uvicorn** - ASGI server

## Quick Start

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Create `requirements.txt`:
```
flask==3.0.0
# or
fastapi==0.104.0
uvicorn==0.24.0

supabase==2.0.0
python-dotenv==1.0.0
flask-cors==4.0.0  # For CORS with React
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
```

## Example Flask Structure

```python
# app.py
from flask import Flask, jsonify
from flask_cors import CORS
from supabase import create_client
import os

app = Flask(__name__)
CORS(app)

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_KEY')
)

@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

## Example FastAPI Structure

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_KEY')
)

@app.get("/api/health")
def health():
    return {"status": "healthy"}
```

## Recommended Folder Structure

```
backend/
├── app.py / main.py    # Application entry point
├── requirements.txt    # Python dependencies
├── .env               # Environment variables (don't commit)
├── config.py          # Configuration settings
├── models/            # Database models
│   └── user.py
├── routes/            # API endpoints
│   ├── auth.py
│   └── users.py
├── middleware/        # Custom middleware
│   └── auth.py
├── utils/             # Helper functions
│   └── validators.py
└── tests/             # Unit tests
    └── test_auth.py
```

## Integration with React Frontend

1. Update React API calls to use backend URL
2. Configure CORS in Python backend
3. Handle authentication tokens
4. Implement API endpoints that complement Supabase

## Running the Server

Flask:
```bash
python app.py
```

FastAPI:
```bash
uvicorn main:app --reload
```

## API Endpoints to Consider

- `GET /api/health` - Health check
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/data` - Fetch protected data
- `POST /api/process` - Process data with Python

## Notes

- Use Supabase for authentication (let React handle it)
- Python backend can add business logic, data processing, ML models
- Keep sensitive operations server-side
- Use Supabase service role key for admin operations
