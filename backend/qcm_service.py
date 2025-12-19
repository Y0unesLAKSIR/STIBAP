from typing import List, Dict, Any, Optional
import random
import httpx

class Question:
    def __init__(self, id: int, text: str, options: List[str], correct_index: int, category: str):
        self.id = id
        self.text = text
        self.options = options
        self.correct_index = correct_index
        self.category = category

class QCMService:
    def __init__(self):
        # Database of questions by Subject
        self.questions_db: Dict[str, List[Question]] = {
            "Maths_Adv": [
                Question(1, "Solve for x: 2x + 5 = 15", ["x = 5", "x = 10", "x = 2.5", "x = 7.5"], 0, "Algebra"),
                Question(2, "What is the square root of 144?", ["10", "11", "12", "14"], 2, "Arithmetic"),
                Question(3, "If f(x) = x² - 3x + 2, what is f(2)?", ["0", "2", "-2", "4"], 0, "Functions"),
                Question(4, "Value of pi (π) to two decimal places?", ["3.12", "3.14", "3.16", "3.18"], 1, "Geometry"),
                Question(5, "Simplify: (x^3 * x^2) / x^4", ["x", "x^2", "x^5", "1"], 0, "Algebra"),
                Question(6, "Derivative of 3x²?", ["6x", "3x", "x^3", "6"], 0, "Calculus"),
                Question(7, "Area of a circle with radius 3?", ["3π", "6π", "9π", "12π"], 2, "Geometry"),
                Question(8, "15% of 200?", ["20", "25", "30", "35"], 2, "Arithmetic"),
                Question(9, "Solve: |x - 3| = 5", ["x = 8", "x = -2", "x = 8 or x = -2", "x = 2"], 2, "Algebra"),
                Question(10, "Which is a prime number?", ["15", "21", "29", "33"], 2, "Arithmetic"),
            ],
            "Java": [
                Question(101, "What is the default value of a boolean in Java?", ["true", "false", "null", "0"], 1, "Basics"),
                Question(102, "Which keyword is used for inheritance?", ["extends", "implements", "inherits", "super"], 0, "OOP"),
                Question(103, "What implies polymorphism?", ["Overloading", "Overriding", "Both", "None"], 2, "OOP"),
                Question(104, "Which collection allows duplicates?", ["Set", "List", "Map", "Queue"], 1, "Collections"),
                Question(105, "Entry point of a Java program?", ["start()", "main()", "init()", "run()"], 1, "Core"),
            ],
            "JEE": [
                Question(201, "What does IoC stand for?", ["Input Output Control", "Inversion of Control", "Interface of Classes", "Internal Object Code"], 1, "Patterns"),
                Question(202, "Which annotation marks a Service?", ["@Component", "@Service", "@Repository", "@Controller"], 1, "Spring"),
                Question(203, "Default scope of a Spring Bean?", ["Prototype", "Singleton", "Request", "Session"], 1, "Spring Core"),
                Question(204, "JPA stands for?", ["Java Persistence API", "Java Programming App", "Java Protocol Adapter", "None"], 0, "Database"),
                Question(205, "Tomcat is a...", ["Web Server", "Servlet Container", "Database", "IDE"], 1, "Infrastructure"),
            ],
            "Python": [
                Question(301, "Output of print(2 ** 3)?", ["6", "8", "9", "5"], 1, "Syntax"),
                Question(302, "Mutable data type?", ["Tuple", "List", "String", "Int"], 1, "Data Structures"),
                Question(303, "Keyword to define a function?", ["func", "def", "function", "lambda"], 1, "Syntax"),
                Question(304, "Library for data analysis?", ["Flask", "Pandas", "PyGame", "Requests"], 1, "Libraries"),
                Question(305, "Decorator symbol?", ["&", "@", "#", "$"], 1, "Advanced"),
            ],
            "AI": [
                Question(401, "What prevents overfitting?", ["Increasing layers", "Regularization", "Higher learning rate", "More epochs"], 1, "ML Theory"),
                Question(402, "Supervised Learning requires...", ["Labeled data", "Unlabeled data", "Rewards", "None"], 0, "ML Core"),
                Question(403, "Activation function for probability?", ["ReLU", "Sigmoid", "Tanh", "Linear"], 1, "Neural Networks"),
                Question(404, "CNN is best for?", ["Text", "Images", "Time Series", "Audio"], 1, "Deep Learning"),
                Question(405, "Gradient Descent is an...", ["Optimization Algorithm", "Loss Function", "Model", "Dataset"], 0, "Optimization"),
            ],
            "Web": [
                Question(501, "HTML tag for highest specific heading?", ["<h1>", "<head>", "<header>", "<top>"], 0, "HTML"),
                Question(502, "CSS property for text color?", ["text-color", "font-color", "color", "foreground"], 2, "CSS"),
                Question(503, "Which is NOT a JS framework?", ["React", "Vue", "Django", "Angular"], 2, "Ecosystem"),
                Question(504, "DOM stands for?", ["Document Object Model", "Data Object Mode", "Digital Ordinance Map", "None"], 0, "Browser"),
                Question(505, "HTTP method for updating?", ["GET", "POST", "PUT", "DELETE"], 2, "HTTP"),
            ],
             "Cybersecurity": [
                Question(601, "What does SQL Injection target?", ["Database", "Web Server", "Browser", "Network"], 0, "Web Security"),
                Question(602, "CIA Triad stands for?", ["Confidentiality, Integrity, Availability", "Control, Intelligence, Access", "Code, Input, Audit", "None"], 0, "Concepts"),
                Question(603, "Which protocol is secure?", ["HTTP", "FTP", "Telnet", "HTTPS"], 3, "Network Security"),
                Question(604, "Phishing is a type of...", ["Social Engineering", "Brute Force", "DDoS", "XSS"], 0, "Attacks"),
                Question(605, "Hashing is...", ["Reversible", "Irreversible", "Encryption", "Compression"], 1, "Cryptography"),
            ],
            "DevOps": [
                Question(701, "Tool for containerization?", ["Ansible", "Docker", "Jenkins", "Git"], 1, "Containers"),
                Question(702, "CI stands for...", ["Continuous Integration", "Code Inspection", "Cloud Infrastructure", "Command Interface"], 0, "Processes"),
                Question(703, "Kubernetes is used for...", ["Coding", "Orchestration", "Testing", "Monitoring"], 1, "Orchestration"),
                Question(704, "Infrastructure as Code tool?", ["Terraform", "Excel", "Word", "Notepad"], 0, "IaC"),
                Question(705, "Default Git branch name?", ["main/master", "dev", "feature", "release"], 0, "VCS"),
            ],
            "Data Science": [
                Question(801, "Dealing with missing values is...", ["Imputation", "Normalization", "Standardization", "Selection"], 0, "Preprocessing"),
                Question(802, "Visualizing correlation?", ["Pie Chart", "Heatmap", "Bar Chart", "Histogram"], 1, "Visualization"),
                Question(803, "Type of Regression?", ["Linear", "Circular", "Triangle", "Square"], 0, "Algorithms"),
                Question(804, "Library for plotting?", ["Matplotlib", "Numpy", "Scikit", "Pandas"], 0, "Libraries"),
                Question(805, "CSV stands for...", ["Comma Separated Values", "Code Syntax Value", "Computer System Video", "None"], 0, "Data Formats"),
            ],
             "Mobile": [
                Question(901, "Android Language?", ["Swift", "Kotlin", "C#", "Ruby"], 1, "Android"),
                Question(902, "iOS Language?", ["Java", "Swift", "Python", "PHP"], 1, "iOS"),
                Question(903, "Cross-platform framework?", ["Flutter", "Spring", "Django", "Laravel"], 0, "Frameworks"),
                Question(904, "APK is for...", ["Android", "iOS", "Windows", "Linux"], 0, "Packaging"),
                Question(905, "App Store belongs to?", ["Google", "Apple", "Microsoft", "Amazon"], 1, "Ecosystem"),
            ]
        }
        # Fallback questions for subjects not yet fully populated
        self.fallback_questions = [
            Question(991, "General Logic: If A > B and B > C, then?", ["A > C", "C > A", "A = C", "None"], 0, "Logic"),
            Question(992, "Pattern: 2, 4, 8, 16, ...?", ["20", "24", "32", "64"], 2, "Pattern"),
            Question(993, "Binary of 5?", ["100", "101", "110", "111"], 1, "Computer Science"),
            Question(994, "Byte size?", ["4 bits", "8 bits", "16 bits", "32 bits"], 1, "Hardware"),
            Question(995, "RAM is...", ["Volatile", "Non-Volatile", "Permanent", "Slow"], 0, "Hardware"),
        ]
        
        # Cache for dynamically generated AI questions so we can grade them later
        self.dynamic_cache: List[Question] = []

    async def get_questions(self, subject: str = "Maths_Adv", count: int = 5) -> List[Dict[str, Any]]:
        """
        Return a random selection of questions for a specific subject.
        Attempts to fetch from AI Microservice first. Falls back to local DB.
        """
        
        # 1. Try AI Microservice
        try:
            async with httpx.AsyncClient() as client:
                # Call Spring Boot Service (Phase 1)
                # Timeout set to 20s to be safe
                response = await client.get(
                    f"http://localhost:8081/api/generate?subject={subject}", 
                    timeout=20.0
                )
                
                if response.status_code == 200:
                    ai_questions_data = response.json()
                    if ai_questions_data:
                        # Convert JSON to Question objects and cache them
                        new_questions = []
                        for q_data in ai_questions_data:
                            # Map JSON fields to Question Object (ensure keys match DTO)
                            # DTO: id, text, options, correctIndex, category
                            q_obj = Question(
                                id=q_data.get("id", random.randint(1000, 9999)),
                                text=q_data["text"],
                                options=q_data["options"],
                                correct_index=q_data["correctIndex"],
                                category=q_data.get("category", subject)
                            )
                            new_questions.append(q_obj)
                        
                        # Add to dynamic cache for grading later
                        self.dynamic_cache.extend(new_questions)
                        
                        # Use these questions for the response
                        # We limit to 'count' here if AI returns more
                        return ai_questions_data[:count]
                        
        except Exception as e:
            print(f"AI Microservice unavailable for {subject}: {e}. Using local fallback.")

        # 2. Fallback to Local Dict
        target_questions = self.questions_db.get(subject, self.fallback_questions)
        
        available_count = len(target_questions)
        select_count = min(count, available_count)
        
        selected = random.sample(target_questions, select_count)
        
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
        
        # Flatten all questions for lookup
        all_questions = []
        for q_list in self.questions_db.values():
            all_questions.extend(q_list)
        all_questions.extend(self.fallback_questions)
        
        # IMPORTANT: Include dynamic AI questions in the lookup
        all_questions.extend(self.dynamic_cache)

        for q_id, selected_idx in answers.items():
            question = next((q for q in all_questions if q.id == int(q_id)), None)
            if question:
                is_correct = question.correct_index == selected_idx
                if is_correct:
                    correct_count += 1
                details.append({
                    "question_id": q_id,
                    "correct": is_correct,
                    "correct_answer": question.options[question.correct_index]
                })

        # Calculate grade out of 20
        # Dynamic scaling: (Correct / Total) * 20
        grade_20 = (correct_count / total_questions) * 20
        
        return {
            "score": correct_count,
            "total": total_questions,
            "grade_20": round(grade_20, 1),
            "details": details
        }

qcm_service = QCMService()
