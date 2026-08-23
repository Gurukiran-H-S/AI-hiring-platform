"""
AI Mock Interview Question Generation & Orchestration Service:
- Tailored question curation based on Job requirements & candidate skills
- Structured expected answer points per question
- Multi-disciplinary support (Technical, HR, Behavioral, Mixed)
"""

from typing import List, Dict, Any, Optional

QUESTION_BANK: Dict[str, List[Dict[str, Any]]] = {
    "python": [
        {
            "question_text": "Explain how FastAPI is useful for building high-performance REST APIs.",
            "category": "FastAPI & Backend",
            "question_type": "Technical",
            "difficulty": "Medium",
            "expected_points": [
                {"id": 1, "point": "Python-based framework", "weight": 1.0},
                {"id": 2, "point": "REST API support", "weight": 1.0},
                {"id": 3, "point": "Type validation with Pydantic", "weight": 1.0},
                {"id": 4, "point": "Automatic OpenAPI Swagger documentation", "weight": 1.0},
                {"id": 5, "point": "Async support and event loop", "weight": 1.0},
            ]
        },
        {
            "question_text": "How do Python decorators work and when would you use them?",
            "category": "Python Core",
            "question_type": "Technical",
            "difficulty": "Medium",
            "expected_points": [
                {"id": 1, "point": "Functions that wrap or modify other functions", "weight": 1.0},
                {"id": 2, "point": "@ syntax decorator notation", "weight": 1.0},
                {"id": 3, "point": "Higher-order function returning a wrapper", "weight": 1.0},
                {"id": 4, "point": "Use cases like logging, auth, or timing", "weight": 1.0},
                {"id": 5, "point": "Preserving metadata with functools.wraps", "weight": 1.0},
            ]
        },
        {
            "question_text": "How would you optimize a slow database query in PostgreSQL or MySQL?",
            "category": "Databases & Performance",
            "question_type": "Technical",
            "difficulty": "Hard",
            "expected_points": [
                {"id": 1, "point": "Database indexing on queried columns", "weight": 1.0},
                {"id": 2, "point": "EXPLAIN ANALYZE execution plan profiling", "weight": 1.0},
                {"id": 3, "point": "Avoiding SELECT * and fetching only needed fields", "weight": 1.0},
                {"id": 4, "point": "Optimizing table joins and subqueries", "weight": 1.0},
                {"id": 5, "point": "Caching frequent results with Redis", "weight": 1.0},
            ]
        },
        {
            "question_text": "Why would you use Docker and containerization in modern backend architecture?",
            "category": "DevOps & Deployment",
            "question_type": "Technical",
            "difficulty": "Medium",
            "expected_points": [
                {"id": 1, "point": "Containerization and environment isolation", "weight": 1.0},
                {"id": 2, "point": "Packaging code and dependencies into Dockerfile images", "weight": 1.0},
                {"id": 3, "point": "Consistent deployment across local and production servers", "weight": 1.0},
                {"id": 4, "point": "Microservices scalability and container orchestration", "weight": 1.0},
                {"id": 5, "point": "Lightweight resource sharing compared to full VMs", "weight": 1.0},
            ]
        },
        {
            "question_text": "Explain the difference between synchronous and asynchronous programming in Python.",
            "category": "Concurrency",
            "question_type": "Technical",
            "difficulty": "Medium",
            "expected_points": [
                {"id": 1, "point": "Asyncio event loop and non-blocking I/O", "weight": 1.0},
                {"id": 2, "point": "Async and await keywords for coroutines", "weight": 1.0},
                {"id": 3, "point": "Blocking synchronous code halts execution thread", "weight": 1.0},
                {"id": 4, "point": "Handling concurrent network requests or database calls", "weight": 1.0},
                {"id": 5, "point": "CPU-bound vs I/O-bound workload trade-offs", "weight": 1.0},
            ]
        }
    ],
    "javascript": [
        {
            "question_text": "How does the JavaScript Event Loop handle asynchronous code like Promises and setTimeout?",
            "category": "JavaScript Core",
            "question_type": "Technical",
            "difficulty": "Medium",
            "expected_points": [
                {"id": 1, "point": "Single-threaded execution call stack", "weight": 1.0},
                {"id": 2, "point": "Microtask queue for Promises", "weight": 1.0},
                {"id": 3, "point": "Macrotask queue for setTimeout and setInterval", "weight": 1.0},
                {"id": 4, "point": "Event loop pushes tasks to empty call stack", "weight": 1.0},
                {"id": 5, "point": "Non-blocking I/O model", "weight": 1.0},
            ]
        },
        {
            "question_text": "Explain React state management and the use of useEffect for lifecycle management.",
            "category": "React Frontend",
            "question_type": "Technical",
            "difficulty": "Medium",
            "expected_points": [
                {"id": 1, "point": "useState for reactive component state", "weight": 1.0},
                {"id": 2, "point": "useEffect for side effects and lifecycle subscriptions", "weight": 1.0},
                {"id": 3, "point": "Dependency array controlling re-executions", "weight": 1.0},
                {"id": 4, "point": "Cleanup functions preventing memory leaks", "weight": 1.0},
                {"id": 5, "point": "Unidirectional data flow and immutable updates", "weight": 1.0},
            ]
        }
    ],
    "hr": [
        {
            "question_text": "Tell me about yourself, your professional background, and why you are interested in this position.",
            "category": "Introduction & Career Goals",
            "question_type": "HR",
            "difficulty": "Easy",
            "expected_points": [
                {"id": 1, "point": "Clear self-introduction and technical background", "weight": 1.0},
                {"id": 2, "point": "Key projects and engineering experience", "weight": 1.0},
                {"id": 3, "point": "Core technical skills aligned with role", "weight": 1.0},
                {"id": 4, "point": "Interest in company mission and growth opportunity", "weight": 1.0},
                {"id": 5, "point": "Career goals and enthusiasm for contribution", "weight": 1.0},
            ]
        },
        {
            "question_text": "Describe a challenging technical obstacle you faced in a project and how you resolved it.",
            "category": "Problem Solving & Behavioral",
            "question_type": "Behavioral",
            "difficulty": "Medium",
            "expected_points": [
                {"id": 1, "point": "Clear problem context and technical obstacle", "weight": 1.0},
                {"id": 2, "point": "Root cause analysis and debugging approach", "weight": 1.0},
                {"id": 3, "point": "Action steps taken to implement solution", "weight": 1.0},
                {"id": 4, "point": "Collaboration with team members or stakeholders", "weight": 1.0},
                {"id": 5, "point": "Measurable positive outcome and key learning", "weight": 1.0},
            ]
        },
        {
            "question_text": "How do you handle tight deadlines and prioritization when requirements change?",
            "category": "Workplace Effectiveness",
            "question_type": "Behavioral",
            "difficulty": "Easy",
            "expected_points": [
                {"id": 1, "point": "Task prioritization using Agile or impact assessment", "weight": 1.0},
                {"id": 2, "point": "Proactive communication with team and managers", "weight": 1.0},
                {"id": 3, "point": "Breaking large problems into manageable deliverables", "weight": 1.0},
                {"id": 4, "point": "Maintaining code quality and automated testing under pressure", "weight": 1.0},
                {"id": 5, "point": "Adaptability and pragmatic trade-offs", "weight": 1.0},
            ]
        }
    ]
}


def generate_interview_questions(
    role_title: str,
    interview_type: str = "Technical",
    job_description: Optional[str] = None,
    candidate_skills: Optional[List[str]] = None,
    num_questions: int = 5
) -> List[Dict[str, Any]]:
    """
    Generates tailored, structured interview questions based on the job role,
    type (Technical, HR, Behavioral, Mixed), and skill context.
    """
    role_lower = (role_title or "").lower()
    desc_lower = (job_description or "").lower()
    type_lower = (interview_type or "technical").lower()

    selected_questions = []

    # 1. Technical Pool Selection
    tech_pool = []
    if "python" in role_lower or "python" in desc_lower or (candidate_skills and any("python" in s.lower() for s in candidate_skills)):
        tech_pool.extend(QUESTION_BANK["python"])
    
    if "javascript" in role_lower or "react" in role_lower or "node" in role_lower or "frontend" in role_lower or "web" in role_lower:
        tech_pool.extend(QUESTION_BANK["javascript"])

    if not tech_pool:
        tech_pool.extend(QUESTION_BANK["python"])

    hr_pool = QUESTION_BANK["hr"]

    # 2. Select according to interview type
    if type_lower == "hr" or type_lower == "cultural":
        selected_questions = list(hr_pool)
    elif type_lower == "behavioral":
        selected_questions = [q for q in hr_pool if q["question_type"] == "Behavioral"]
        if not selected_questions:
            selected_questions = list(hr_pool)
    elif type_lower == "mixed":
        # Combine technical and HR
        half = max(1, num_questions // 2)
        selected_questions = tech_pool[:half] + hr_pool[:(num_questions - half)]
    else:  # Technical
        selected_questions = list(tech_pool)
        if len(selected_questions) < num_questions:
            selected_questions.extend(hr_pool)

    # 3. Trim or pad to requested num_questions
    final_list = selected_questions[:num_questions]
    
    # Format with sequential question numbers
    formatted = []
    for idx, q in enumerate(final_list):
        formatted.append({
            "question_number": idx + 1,
            "question_text": q["question_text"],
            "question_type": q.get("question_type", "Technical"),
            "category": q.get("category", "General Technical"),
            "difficulty": q.get("difficulty", "Medium"),
            "expected_points": q["expected_points"]
        })

    return formatted
