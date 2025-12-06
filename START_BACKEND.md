# Start the STIBAP backend

Preferred (one step from project root):

    python main.py

What this does:
- Uses the virtual environment at `backend\venv` if available
- Starts `backend\main.py` (Uvicorn) in the proper working directory

First‑time setup (only needed once per machine):

    backend\QUICK_START.bat

Troubleshooting:
- If `python main.py` says dependencies are missing, run `backend\QUICK_START.bat` once, then retry `python main.py`.
- Ensure you run the command from the project root (same folder as this file).
