@echo off
echo ===================================
echo STIBAP Backend - SSL Fix Version
echo ===================================
echo.

cd /d "%~dp0"

echo [1/5] Activating virtual environment...
if not exist venv (
    echo ERROR: Virtual environment not found!
    echo Run QUICK_START.bat first
    pause
    exit /b 1
)
call venv\Scripts\activate
echo.

echo [2/5] Setting SSL bypass environment variables...
set CURL_CA_BUNDLE=
set REQUESTS_CA_BUNDLE=
set PYTHONHTTPSVERIFY=0
echo Environment configured
echo.

echo [3/5] Checking if model is already downloaded...
if exist models\sentence-transformers_all-MiniLM-L6-v2 (
    echo Model already downloaded! Skipping download.
    goto :start_server
)
echo.

echo [4/5] Downloading AI model with SSL workarounds...
echo This may take 5-10 minutes for the first time...
echo.
python download_model.py
if %errorlevel% neq 0 (
    echo.
    echo WARNING: Model download may have failed.
    echo Trying to start anyway...
    echo.
)

:start_server
echo.
echo [5/5] Starting backend server...
echo Backend will run on http://localhost:8000
echo Press CTRL+C to stop
echo.
python main.py
