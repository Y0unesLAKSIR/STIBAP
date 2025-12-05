import joblib
import pandas as pd
import os
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PerformanceInput(BaseModel):
    qcm_score: float  # Score out of 20 from the diagnostic test
    studytime: int
    failures: int
    absences: int
    schoolsup: bool
    famsup: bool
    activities: bool
    internet: bool

class PerformanceService:
    def __init__(self):
        self.model = None
        self.model_path = os.path.join(os.path.dirname(__file__), "../Model/Models/student_performance_model.pkl")
        self._load_model()

    def _load_model(self):
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                logger.info(f"Performance model loaded successfully from {self.model_path}")
            else:
                logger.error(f"Model file not found at {self.model_path}")
        except Exception as e:
            logger.error(f"Failed to load performance model: {e}")

    def predict_performance(self, input_data: PerformanceInput) -> Dict[str, Any]:
        if not self.model:
            return {"error": "Model not loaded"}

        try:
            # Prepare data frame with expected features
            # The model expects: ['G1', 'studytime', 'failures', 'absences', 'schoolsup_yes', 'famsup_yes', 'activities_yes', 'internet_yes']
            
            # Use qcm_score as G1 (both are 0-20 scale)
            g1_value = input_data.qcm_score
            
            data = {
                'G1': [g1_value],
                'studytime': [input_data.studytime],
                'failures': [input_data.failures],
                'absences': [input_data.absences],
                'schoolsup_yes': [1 if input_data.schoolsup else 0],
                'famsup_yes': [1 if input_data.famsup else 0],
                'activities_yes': [1 if input_data.activities else 0],
                'internet_yes': [1 if input_data.internet else 0]
            }
            
            df = pd.DataFrame(data)
            
            # Make prediction
            prediction = self.model.predict(df)[0]
            probability = self.model.predict_proba(df)[0].max()
            
            # Map prediction to readable result
            # Assuming 0=Fail (<10), 1=Pass (>=10) based on typical student-mat classification tasks
            result_status = "Pass" if prediction == 1 else "Fail"
            
            # Generate Intelligent Tutoring Feedback
            feedback = []
            recommendation_type = "General"
            
            if result_status == "Fail":
                recommendation_type = "Remedial"
                feedback.append("⚠️ At Risk: Your profile suggests you might struggle to pass.")
                if g1_value < 10:
                    feedback.append("• Your diagnostic score (G1) is low. Focus on reviewing basics.")
                if input_data.studytime < 2:
                    feedback.append("• Increasing study time could significantly improve your chances.")
                if input_data.absences > 5:
                    feedback.append("• High absences are a risk factor. Try to attend all classes.")
            else:
                recommendation_type = "Advanced"
                feedback.append("✅ On Track: You are likely to pass!")
                if g1_value >= 15:
                    feedback.append("• Excellent diagnostic score! You're ready for advanced topics.")
                
            return {
                "prediction": int(prediction),
                "result": result_status,
                "confidence": float(probability),
                "recommendation_type": recommendation_type,
                "feedback": feedback,
                "input_summary": input_data.dict()
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {"error": str(e)}

# Global instance
performance_service = PerformanceService()
