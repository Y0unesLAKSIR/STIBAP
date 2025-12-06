# backend/ai_engine.py

import joblib
import os
from pathlib import Path

class AIEngine:
    def __init__(self):
        # Path to the tutor model from Model directory
        model_path = Path(__file__).parent.parent / "Model" / "tutor_model_combined.pkl"

        if not model_path.exists():
            raise FileNotFoundError(f"Model not found at {model_path}")

        # Load the trained Random Forest model
        self.model = joblib.load(model_path)
        print(f"✅ AI Model loaded from: {model_path}")

    def predict_student_pass(self, student_data):
        """
        Predict if a student will pass based on their features.

        Args:
            student_data: DataFrame with columns [G1, studytime, failures, absences,
                         schoolsup_yes, famsup_yes, activities_yes, internet_yes]

        Returns:
            dict with prediction (0/1) and confidence score
        """
        prediction = self.model.predict(student_data)
        probability = self.model.predict_proba(student_data)

        return {
            "prediction": int(prediction[0]),
            "confidence": float(probability[0][prediction[0]]),
            "pass": prediction[0] == 1
        }
