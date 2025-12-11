import joblib
import pandas as pd
import os
import logging
from typing import Dict, Any
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Expert Pedagogical Advice Dictionary (The "Knowledge Base")
REMEDIAL_ACTIONS = {
    "Java": "Review Object-Oriented Programming concepts, specifically Inheritance and Polymorphism. Practice stream APIs.",
    "JEE": "Review Servlet lifecycle and Spring Boot annotations. Practice deploying .war files on Tomcat.",
    "DotNet": "Focus on ASP.NET MVC architecture, Entity Framework, and LINQ queries.",
    "Python": "Practice list comprehensions, decorators, and data manipulation with Pandas/NumPy.",
    "Web": "Review the DOM, Event Bubbling, and modern ES6+ features. Master React hooks like useEffect.",
    "Mobile": "Understand the Android Activity Lifecycle and State Management (Redux/Context) in Flutter/Kotlin.",
    "Cloud": "Study AWS/Azure core services (EC2, S3, Lambda) and Infrastructure as Code concepts (Terraform).",
    "AI": "Review Gradient Descent, Overfitting prevention (Regularization), and Neural Network backpropagation.",
    "Data Science": "Focus on Feature Engineering, Hypothesis Testing, and model evaluation metrics (Precision/Recall).",
    "DevOps": "Understand CI/CD pipelines (Jenkins/GitHub Actions), Docker containerization, and Kubernetes.",
    "Cybersecurity": "Review OWASP Top 10 vulnerabilities, Encryption standards (AES, RSA), and Penetration Testing basics.",
    "Database": "Practice complex SQL joins, Stored Procedures, and Database Normalization (3NF).",
    "Networks": "Review the OSI Model layers, TCP/IP handshake, Subnetting, and Routing protocols (OSPF, BGP).",
    "Algorithms": "Master Time Complexity (Big O), Dynamic Programming, and Graph traversal (BFS/DFS).",
    "Maths_Adv": "Focus on Differential Equations, Linear Algebra (Eigenvalues/Eigenvectors), and Calculus.",
    "Statistics": "Review Probability distributions, Hypothesis testing (p-values), and Regression analysis.",
    "Physics": "Review Newton's Laws, Thermodynamics cycles, and Maxwell's Equations.",
    "Chemistry": "Study Periodic Table trends, Organic Chemistry functional groups, and Stoichiometry.",
    "Biology": "Focus on Cellular Respiration (Krebs Cycle), Genetics, and Molecular Biology.",
    "Marketing": "Review the 4Ps of Marketing, Consumer Behavior theories, and SEO/SEM strategies.",
    "Management": "Study SWOT analysis, Leadership styles, and Agile/Scrum Project Management.",
    "Accounting": "Master Financial Statements (Balance Sheet, P&L), Double-entry bookkeeping, and Cash Flow analysis.",
    "Economics": "Review Supply and Demand elasticity, GDP calculation, and Monetary Policy tools.",
    "Law": "Study Contract Law essentials, Intellectual Property rights, and Business Law framework.",
    "Communication": "Focus on Active Listening, Non-verbal communication, and Public Speaking techniques.",
    "English": "Practice advanced grammar, Essay structuring, and Business English vocabulary.",
    "French": "Focus on complex conjugation (Subjunctive), Literary analysis, and formal Correspondence.",
    "History": "Review the causes and consequences of major world conflicts (WWI/WWII) and Cold War geopolitics.",
    "Audit": "Understand Internal Control Frameworks (COSO), ISO 9001 standards, and Audit Evidence gathering.",
    "BigData": "Focus on Hadoop ecosystem (HDFS, MapReduce) and Spark dataframe operations.",
    "UML": "Review Class Diagrams, Sequence Diagrams, and Use Case modeling."
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
        """
        Predicts student performance and generates intelligent, context-aware feedback.
        """
        if not self.model:
            return {
                "status": "risk",
                "probability": 0.0,
                "message": "System Error",
                "detailed_feedback": "The AI model is currently unavailable. Please contact support."
            }

        try:
            # 1. Prepare Data
            # Strictly map inputs to model features: ['G1', 'studytime', 'failures', 'absences', 'schoolsup', 'famsup', 'activities', 'internet']
            # Use qcm_score (0-20) as G1
            
            data = {
                'G1': [input_data.qcm_score],
                'studytime': [input_data.studytime],
                'failures': [input_data.failures],
                'absences': [input_data.absences],
                'schoolsup_yes': [1 if input_data.schoolsup else 0],
                'famsup_yes': [1 if input_data.famsup else 0],
                'activities_yes': [1 if input_data.activities else 0],
                'internet_yes': [1 if input_data.internet else 0]
            }
            
            df = pd.DataFrame(data)
            
            # 2. Run Prediction
            # 0 = Fail (At Risk), 1 = Pass (Success)
            prediction = self.model.predict(df)[0]
            
            # 3. Probability (Confidence)
            if hasattr(self.model, "predict_proba"):
                # Get probability of the predicted class
                probs = self.model.predict_proba(df)[0]
                probability = probs[1] if prediction == 1 else probs[0]
            else:
                probability = 1.0 # Fallback
            
            # 4. "Intelligent Logic" Construction
            status = "success" if prediction == 1 else "risk"
            message = "Success" if prediction == 1 else "At Risk"
            detailed_feedback = ""

            if status == "success":
                detailed_feedback = f"Great job! Based on your profile and diagnostic score, you are on track to succeed in {input_data.subject}. Keep maintaining your study habits!"
                if input_data.qcm_score >= 15:
                    detailed_feedback += " Your strong foundation makes you ready for advanced topics."
            else:
                # Build Remedial Feedback
                reasons = []
                if input_data.absences > 10:
                    reasons.append("high absences")
                if input_data.failures > 0:
                    reasons.append("previous academic difficulties")
                if input_data.studytime < 2:
                    reasons.append("low study time")
                if input_data.qcm_score < 10:
                    reasons.append("weak diagnostic score")
                
                reason_str = ", ".join(reasons) if reasons else "your current profile metrics"
                
                # Fetch Subject-Specific Advice
                technical_advice = REMEDIAL_ACTIONS.get(input_data.subject, f"Review the core fundamentals of {input_data.subject}.")
                
                detailed_feedback = f"Our model identifies a risk of failure due to {reason_str}. For {input_data.subject}, we strictly recommend: {technical_advice}"

            return {
                "status": status,
                "probability": float(probability),
                "message": message,
                "detailed_feedback": detailed_feedback
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {
                "status": "risk",
                "probability": 0.0,
                "message": "Error",
                "detailed_feedback": f"An error occurred during analysis: {str(e)}"
            }

# Global instance
performance_service = PerformanceService()
