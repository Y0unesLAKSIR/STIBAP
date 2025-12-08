import joblib
import pandas as pd
import os
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Expert Pedagogical Advice Dictionary
SUBJECT_ADVICE = {
    # IT & Programming
    "Java": "Review Object-Oriented Programming concepts, specifically Inheritance and Polymorphism. Practice stream APIs.",
    "JEE": "Focus on Servlet lifecycles, Spring Boot annotations, and Dependency Injection patterns.",
    "DotNet": "Deepen your understanding of CLR, LINQ queries, and Async/Await patterns in C#.",
    "Python": "Practice list comprehensions, decorators, and data manipulation with Pandas.",
    "Web": "Review the DOM, Event Bubbling, and modern ES6+ JavaScript syntax. Check React hooks.",
    "Mobile": "Understand the Component Lifecycle and State Management (Redux/Context).",
    "Cloud": "Study AWS/Azure core services (EC2, S3, Lambda) and Infrastructure as Code concepts.",
    "AI": "Review Gradient Descent, Overfitting prevention (Regularization), and Neural Network architectures.",
    "Data Science": "Focus on Feature Engineering, Hypothesis Testing, and model evaluation metrics.",
    "DevOps": "Understand CI/CD pipelines, Docker containerization, and Kubernetes orchestration.",
    "Cybersecurity": "Review OWASP Top 10 vulnerabilities and encryption standards (AES, RSA).",
    "Database": "Practice complex SQL joins, Indexing strategies, and Normalization forms.",
    "Networks": "Review the OSI Model layers, TCP/IP handshake, and Subnetting.",
    "Algorithms": "Master Time Complexity (Big O), Recursion, and Graph traversal (BFS/DFS).",
    
    # Sciences & Math
    "Maths_Adv": "Focus on Differential Equations and Linear Algebra matrices.",
    "Statistics": "Review Probability distributions, Hypothesis testing, and Regression analysis.",
    "Physics": "Review Newton's Laws, Thermodynamics cycles, and Electromagnetism equations.",
    "Chemistry": "Study Periodic Table trends, Chemical Bonding, and Stoichiometry.",
    "Biology": "Focus on Cell division (Mitosis/Meiosis) and Genetics inheritance patterns.",
    
    # Business & Humanities
    "Marketing": "Review the 4Ps of Marketing, Consumer Behavior, and Digital Marketing strategies.",
    "Management": "Study SWOT analysis, Leadership styles, and Project Management methodologies (Agile).",
    "Accounting": "Master Financial Statements (Balance Sheet, P&L) and Double-entry bookkeeping.",
    "Economics": "Review Supply and Demand curves, Macroeconomic indicators (GDP, Inflation).",
    "Law": "Study Contract Law essentials and Intellectual Property rights.",
    "Communication": "Focus on Active Listening, Non-verbal communication, and Presentation skills.",
    "English": "Practice advanced grammar, essay structuring, and reading comprehension.",
    "French": "Focus on conjugation (Subjunctive), agreement rules, and vocabulary expansion.",
    "History": "Review the causes and consequences of major world conflicts and industrial revolutions.",
    "Audit": "Understand Internal Control Frameworks (COSO) and Audit Evidence standards."
}

class PerformanceInput(BaseModel):
    subject: str
    qcm_score: float  # G1
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
        # Updated to new model path
        self.model_path = os.path.join(os.path.dirname(__file__), "../Model/Models/final_intelligent_tutor_model.pkl")
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
            # 1. Prepare Data
            # Map inputs to model features (Strict Order: G1, studytime, failures, absences, schoolsup, famsup, activities, internet)
            # Note: Model expects int/numeric inputs. Booleans should be 0 or 1.
            
            # Use qcm_score (0-20) as G1
            g1_value = input_data.qcm_score
            
            data = {
                'G1': [g1_value],
                'studytime': [input_data.studytime],
                'failures': [input_data.failures],
                'absences': [input_data.absences],
                'schoolsup': [1 if input_data.schoolsup else 0],
                'famsup': [1 if input_data.famsup else 0],
                'activities': [1 if input_data.activities else 0],
                'internet': [1 if input_data.internet else 0]
            }
            
            df = pd.DataFrame(data)
            
            # 2. Run Prediction
            # The model predicts 0 (Fail) or 1 (Pass)
            prediction = self.model.predict(df)[0]
            
            # 3. Probability (Confidence)
            # Safe access to predict_proba
            if hasattr(self.model, "predict_proba"):
                probability = self.model.predict_proba(df)[0].max()
            else:
                probability = 1.0 # Fallback if model doesn't support proba
            
            result_status = "Pass" if prediction == 1 else "Fail"
            
            # 4. Generate Intelligent Context-Aware Feedback
            feedback = []
            
            # General Profile Feedback (Risk Factors)
            if input_data.absences > 10:
                feedback.append({
                    "type": "warning", 
                    "message": "⚠️ High Absences Alert: Missing classes is the #1 cause of failure. Attendance is critical."
                })
            
            if input_data.failures > 0:
                feedback.append({
                    "type": "warning",
                    "message": "⚠️ Past Struggles: Previous difficulties indicate a need for a foundational review."
                })

            if input_data.studytime < 2:
                feedback.append({
                    "type": "warning",
                    "message": "⚠️ Low Study Time: Your current study hours are insufficient for this subject's complexity."
                })

            # Outcome-Specific Feedback
            if result_status == "Fail":
                recommendation_type = "Remedial"
                feedback.append({
                    "type": "warning",
                    "message": "🔴 At Risk: The model predicts a high likelihood of difficulty based on your profile."
                })
                
                # The "Secret Sauce": Subject-Specific Pedagogical Advice
                subject_advice = SUBJECT_ADVICE.get(input_data.subject)
                if subject_advice:
                    feedback.append({
                        "type": "info",
                        "message": f"💡 Pedagogical Advice for {input_data.subject}: {subject_advice}"
                    })
                else:
                     feedback.append({
                        "type": "info",
                        "message": f"💡 Advice: Focus on the core fundamentals of {input_data.subject}."
                    })

            else:
                recommendation_type = "Advanced"
                feedback.append({
                    "type": "success",
                    "message": "✅ On Track: You are well-positioned to succeed!"
                })
                if g1_value >= 15:
                    feedback.append({
                        "type": "success",
                        "message": "🌟 Excellent Foundation: You are ready for advanced modules and projects."
                    })
                
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
