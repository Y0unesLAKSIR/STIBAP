from typing import List, Dict, Any
import random

class Question:
    def __init__(self, id: int, text: str, options: List[str], correct_index: int, category: str):
        self.id = id
        self.text = text
        self.options = options
        self.correct_index = correct_index
        self.category = category

class QCMService:
    def __init__(self):
        self.questions = [
            Question(1, "Solve for x: 2x + 5 = 15", ["x = 5", "x = 10", "x = 2.5", "x = 7.5"], 0, "Algebra"),
            Question(2, "What is the square root of 144?", ["10", "11", "12", "14"], 2, "Arithmetic"),
            Question(3, "If f(x) = x² - 3x + 2, what is f(2)?", ["0", "2", "-2", "4"], 0, "Functions"),
            Question(4, "What is the value of pi (π) to two decimal places?", ["3.12", "3.14", "3.16", "3.18"], 1, "Geometry"),
            Question(5, "Simplify: (x^3 * x^2) / x^4", ["x", "x^2", "x^5", "1"], 0, "Algebra"),
            Question(6, "What is the derivative of 3x²?", ["6x", "3x", "x^3", "6"], 0, "Calculus"),
            Question(7, "Calculate the area of a circle with radius 3.", ["3π", "6π", "9π", "12π"], 2, "Geometry"),
            Question(8, "What is 15% of 200?", ["20", "25", "30", "35"], 2, "Arithmetic"),
            Question(9, "Solve: |x - 3| = 5", ["x = 8", "x = -2", "x = 8 or x = -2", "x = 2"], 2, "Algebra"),
            Question(10, "Which of these is a prime number?", ["15", "21", "29", "33"], 2, "Arithmetic"),
            Question(11, "What is the slope of the line y = -2x + 4?", ["2", "-2", "4", "-4"], 1, "Geometry"),
            Question(12, "Evaluate log₁₀(1000)", ["1", "2", "3", "10"], 2, "Algebra"),
            Question(13, "If sin(θ) = 1/2, what is θ (in degrees, 0-90)?", ["30°", "45°", "60°", "90°"], 0, "Trigonometry"),
            Question(14, "Expand (x + 3)(x - 3)", ["x² + 9", "x² - 9", "x² - 6x + 9", "x² + 6x + 9"], 1, "Algebra"),
            Question(15, "What is the probability of rolling a 6 on a standard die?", ["1/2", "1/3", "1/6", "1/5"], 2, "Probability"),
            Question(16, "Solve for x: 3^x = 27", ["2", "3", "4", "9"], 1, "Algebra"),
            Question(17, "What is the sum of angles in a triangle?", ["90°", "180°", "270°", "360°"], 1, "Geometry"),
            Question(18, "If A = {1, 2, 3} and B = {3, 4, 5}, what is A ∩ B?", ["{1, 2}", "{4, 5}", "{3}", "{1, 2, 3, 4, 5}"], 2, "Sets"),
            Question(19, "What is the median of [1, 3, 3, 6, 7, 8, 9]?", ["3", "6", "5", "7"], 1, "Statistics"),
            Question(20, "Factorize: x² - 5x + 6", ["(x-2)(x-3)", "(x+2)(x+3)", "(x-1)(x-6)", "(x+1)(x+6)"], 0, "Algebra"),
        ]

    def get_questions(self, count: int = 10) -> List[Dict[str, Any]]:
        """Return a random selection of questions without the correct answer."""
        selected = random.sample(self.questions, min(count, len(self.questions)))
        return [
            {
                "id": q.id,
                "text": q.text,
                "options": q.options,
                "category": q.category
            }
            for q in selected
        ]

    def calculate_score(self, answers: Dict[int, int]) -> Dict[str, Any]:
        """Calculate score based on provided answers {question_id: selected_index}."""
        correct_count = 0
        total_questions = len(answers)
        
        if total_questions == 0:
            return {"score": 0, "total": 0, "grade_20": 0}

        details = []
        
        for q_id, selected_idx in answers.items():
            question = next((q for q in self.questions if q.id == int(q_id)), None)
            if question:
                is_correct = question.correct_index == selected_idx
                if is_correct:
                    correct_count += 1
                details.append({
                    "question_id": q_id,
                    "correct": is_correct,
                    "correct_answer": question.options[question.correct_index]
                })

        # Calculate grade out of 20 (G1 equivalent)
        # If user answers 10 questions, each is worth 2 points.
        grade_20 = (correct_count / total_questions) * 20
        
        return {
            "score": correct_count,
            "total": total_questions,
            "grade_20": round(grade_20, 1), # G1 is typically integer or close to it, but float is fine for input
            "details": details
        }

qcm_service = QCMService()
