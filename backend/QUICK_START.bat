@echo off
echo ===================================
echo STIBAP Backend Quick Start
echo ===================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Python...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python not found! Install from python.org
    pause
    exit /b 1
)
echo.

echo [2/4] Activating virtual environment...
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
echo.

echo [3/4] Installing dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies.
    pause
    exit /b 1
)
echo.

echo [4/4] Starting backend server...
echo Backend will run on http://localhost:8000
echo Press CTRL+C to stop
echo.
python main.py
