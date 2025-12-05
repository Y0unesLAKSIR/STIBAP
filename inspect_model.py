import joblib
import sys
import os

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

model_path = r"c:\DEV\PFA\Model\Models\student_performance_model.pkl"

try:
    model = joblib.load(model_path)
    if hasattr(model, 'classes_'):
        print(f"Classes: {model.classes_}")
    else:
        print("Model has no classes_ attribute.")

except Exception as e:
    print(f"Error: {e}")
