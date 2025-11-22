import os
import sys
import subprocess
from pathlib import Path

"""
Launcher script to start the STIBAP backend with a single command:

    python main.py

Run this from the project root. It will:
- Prefer the backend virtual environment at backend\venv if it exists.
- Start the backend server by executing backend\main.py.

If dependencies are not installed yet, run backend\QUICK_START.bat once to set up the venv
and install requirements. After that, you can always use `python main.py` from the root.
"""

def main():
    project_root = Path(__file__).resolve().parent
    backend_dir = project_root / "backend"
    backend_main = backend_dir / "main.py"

    if not backend_main.exists():
        print("Error: backend/main.py not found. Please ensure you are running from the project root.")
        sys.exit(1)

    # Prefer the backend virtual environment python if present
    venv_python = backend_dir / "venv" / "Scripts" / "python.exe"

    try:
        if venv_python.exists():
            # If we're not already using the venv's python, re-exec with it
            if Path(sys.executable).resolve() != venv_python.resolve():
                returncode = subprocess.call([str(venv_python), str(backend_main)], cwd=str(backend_dir))
                sys.exit(returncode)

        # Fall back to current interpreter
        returncode = subprocess.call([sys.executable, str(backend_main)], cwd=str(backend_dir))
        sys.exit(returncode)
    except FileNotFoundError as e:
        print(f"Failed to start backend: {e}")
        print("Tip: Run backend\\QUICK_START.bat once to set up the environment, then retry `python main.py`.")
        sys.exit(1)


if __name__ == "__main__":
    main()
