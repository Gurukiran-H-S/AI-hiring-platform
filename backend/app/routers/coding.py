from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.models.user import User, UserRole
from app.models.coding import (
    CodingProblem,
    TestCase,
    CandidateSubmission,
    CandidateCodingStats,
    WeeklyAssessment,
    RecruiterAssessment,
    Language,
    AIReview,
    ProblemDifficulty,
    SubmissionStatus
)
from app.middleware.auth_middleware import get_current_user, require_role
from app.services.judge0_service import Judge0Service
from app.services.sandbox_runner import CodeSandboxRunner
from app.services.ai_coding_service import ai_coding_service
from app.services.dataset_importer import seed_default_problems, import_huggingface_dataset

router = APIRouter(prefix="/api/coding", tags=["Coding Assessment"])

# Pydantic Schemas
class CodeRunRequest(BaseModel):
    problem_id: str
    language: str
    code: str
    input_data: Optional[str] = ""

class CodeSubmitRequest(BaseModel):
    problem_id: str
    language: str
    code: str

class AIHintRequest(BaseModel):
    problem_id: str
    code: str
    hint_level: Optional[int] = 1

class AIErrorExplainRequest(BaseModel):
    code: str
    error_message: str
    language: str = "python"

class RecruiterAssessmentCreate(BaseModel):
    title: str
    target_role: str
    difficulty: str = "Medium"
    problem_ids: List[str]
    time_limit_minutes: int = 60
    passing_score: float = 70.0


@router.on_event("startup")
def startup_seed_problems():
    """Ensure seed problems and languages exist on startup."""
    try:
        from app.database import SessionLocal
        db = SessionLocal()
        seed_default_problems(db)

        # Seed Default Languages if empty
        if db.query(Language).count() == 0:
            default_langs = [
                Language(id=1, name="python", display_name="Python 3", judge0_language_id=71, file_extension=".py"),
                Language(id=2, name="cpp", display_name="C++ (GCC)", judge0_language_id=54, file_extension=".cpp"),
                Language(id=3, name="java", display_name="Java 17", judge0_language_id=62, file_extension=".java"),
                Language(id=4, name="javascript", display_name="JavaScript (Node)", judge0_language_id=63, file_extension=".js"),
            ]
            db.add_all(default_langs)
            db.commit()

        db.close()
    except Exception as e:
        print("Startup seed error:", e)


@router.get("/languages")
def get_languages(db: Session = Depends(get_db)):
    """Get active language list."""
    langs = db.query(Language).filter(Language.is_active == True).all()
    if not langs:
        return [
            {"id": 1, "name": "python", "display_name": "Python 3", "judge0_language_id": 71},
            {"id": 2, "name": "cpp", "display_name": "C++ (GCC)", "judge0_language_id": 54},
            {"id": 3, "name": "java", "display_name": "Java 17", "judge0_language_id": 62},
            {"id": 4, "name": "javascript", "display_name": "JavaScript (Node)", "judge0_language_id": 63},
        ]
    return [{"id": l.id, "name": l.name, "display_name": l.display_name, "judge0_language_id": l.judge0_language_id} for l in langs]


@router.get("/problems")
def get_problems(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve paginated problem list."""
    query = db.query(CodingProblem).filter(CodingProblem.is_active == True)
    
    if category and category != "All":
        query = query.filter(CodingProblem.category == category)
    if difficulty and difficulty != "All":
        query = query.filter(CodingProblem.difficulty == difficulty)
    if search:
        query = query.filter(CodingProblem.title.ilike(f"%{search}%"))

    problems = query.all()
    return [
        {
            "id": str(p.id),
            "title": p.title,
            "slug": p.slug,
            "difficulty": p.difficulty.value if hasattr(p.difficulty, 'value') else p.difficulty,
            "category": p.category,
            "tags": p.tags or [],
            "acceptance_rate": p.acceptance_rate,
            "total_submissions": p.total_submissions,
        }
        for p in problems
    ]


@router.get("/problems/{problem_id}")
def get_problem_detail(problem_id: str, db: Session = Depends(get_db)):
    """Get single problem detail with PUBLIC sample testcases (hidden test cases are filtered out)."""
    problem = db.query(CodingProblem).filter(CodingProblem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    sample_tests = db.query(TestCase).filter(TestCase.problem_id == problem.id, TestCase.is_hidden == False).all()

    return {
        "id": str(problem.id),
        "title": problem.title,
        "slug": problem.slug,
        "difficulty": problem.difficulty.value if hasattr(problem.difficulty, 'value') else problem.difficulty,
        "category": problem.category,
        "tags": problem.tags or [],
        "description": problem.description,
        "constraints": problem.constraints,
        "function_name": problem.function_name or "twoSum",
        "sample_input": problem.sample_input,
        "sample_output": problem.sample_output,
        "time_limit_seconds": problem.time_limit_seconds,
        "memory_limit_mb": problem.memory_limit_mb,
        "starter_code_python": f"class Solution:\n    def {problem.function_name or 'twoSum'}(self, nums: list[int], target: int) -> list[int]:\n        # Write your algorithm here\n        pass\n",
        "starter_code_java": f"class Solution {{\n    public int[] {problem.function_name or 'twoSum'}(int[] nums, int target) {{\n        // Write your solution\n        return new int[]{{}};\n    }}\n}}\n",
        "starter_code_cpp": f"class Solution {{\npublic:\n    vector<int> {problem.function_name or 'twoSum'}(vector<int>& nums, int target) {{\n        return {{}};\n    }}\n}};\n",
        "starter_code_javascript": f"class Solution {{\n    {problem.function_name or 'twoSum'}(nums, target) {{\n        // Write your solution\n        return [];\n    }}\n}}\n",
        "sample_test_cases": [
            {
                "id": str(tc.id),
                "input_data": tc.input_data,
                "expected_output": tc.expected_output,
            }
            for tc in sample_tests
        ]
    }


@router.post("/run")
def run_code_sample(
    req: CodeRunRequest,
    db: Session = Depends(get_db)
):
    """Run candidate solution against PUBLIC SAMPLE testcases only via Judge0 Service / Local Sandbox."""
    problem = db.query(CodingProblem).filter(CodingProblem.id == req.problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    sample_tests = db.query(TestCase).filter(TestCase.problem_id == problem.id, TestCase.is_hidden == False).all()
    if not sample_tests:
        sample_tests = [TestCase(input_data=req.input_data or problem.sample_input or "", expected_output=problem.sample_output or "")]

    judge_service = Judge0Service()
    test_results = []
    passed_count = 0

    for idx, tc in enumerate(sample_tests, start=1):
        res = judge_service.submit_and_poll(
            language=req.language,
            source_code=req.code,
            stdin=tc.input_data,
            expected_output=tc.expected_output,
            cpu_time_limit=problem.time_limit_seconds,
            memory_limit_mb=problem.memory_limit_mb
        )
        is_passed = (res["status"] == "Accepted")
        if is_passed:
            passed_count += 1
        
        test_results.append({
            "number": idx,
            "status": res["status"],
            "input": tc.input_data,
            "expected_output": tc.expected_output,
            "actual_output": res.get("stdout") or res.get("error_message") or "",
            "execution_time": res.get("execution_time", 0.0),
        })

    overall_status = "Accepted" if passed_count == len(sample_tests) else test_results[0]["status"]

    return {
        "status": overall_status,
        "passed_test_cases": passed_count,
        "total_test_cases": len(sample_tests),
        "execution_time": test_results[0].get("execution_time", 0.0) if test_results else 0.0,
        "test_cases": test_results
    }


@router.post("/submit")
def submit_code(
    req: CodeSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit solution method, execute against HIDDEN testcases, update points/solved stats idempotently, and trigger AI review."""
    problem = db.query(CodingProblem).filter(CodingProblem.id == req.problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    test_cases = db.query(TestCase).filter(TestCase.problem_id == problem.id).all()
    if not test_cases:
        test_cases = [TestCase(input_data=problem.sample_input or "", expected_output=problem.sample_output or "")]

    judge_service = Judge0Service()
    passed_count = 0
    total_time = 0.0
    overall_status = "Accepted"
    first_error = None
    first_token = None

    for idx, tc in enumerate(test_cases, start=1):
        res = judge_service.submit_and_poll(
            language=req.language,
            source_code=req.code,
            stdin=tc.input_data,
            expected_output=tc.expected_output,
            cpu_time_limit=problem.time_limit_seconds,
            memory_limit_mb=problem.memory_limit_mb
        )
        total_time += res.get("execution_time", 0.0)
        if not first_token:
            first_token = res.get("judge_token")

        if res["status"] == "Accepted":
            passed_count += 1
        else:
            overall_status = res["status"]
            first_error = res.get("error_message") or f"Test Case #{idx} Failed."
            break

    status_enum = SubmissionStatus.ACCEPTED if overall_status == "Accepted" else SubmissionStatus.WRONG_ANSWER
    if overall_status == "Compilation Error":
        status_enum = SubmissionStatus.COMPILATION_ERROR
    elif overall_status == "Time Limit Exceeded":
        status_enum = SubmissionStatus.TIME_LIMIT_EXCEEDED
    elif overall_status == "Runtime Error":
        status_enum = SubmissionStatus.RUNTIME_ERROR

    # Create submission record
    submission = CandidateSubmission(
        candidate_id=current_user.id,
        problem_id=problem.id,
        language=req.language,
        code=req.code,
        judge_token=first_token,
        status=status_enum,
        execution_time_seconds=round(total_time, 3),
        passed_test_cases=passed_count,
        total_test_cases=len(test_cases),
        error_message=first_error,
    )
    db.add(submission)

    # Update problem submission counts
    problem.total_submissions += 1
    if status_enum == SubmissionStatus.ACCEPTED:
        problem.total_accepted += 1
    problem.acceptance_rate = round((problem.total_accepted / max(1, problem.total_submissions)) * 100, 1)

    # Update candidate coding stats
    stats = db.query(CandidateCodingStats).filter(CandidateCodingStats.candidate_id == current_user.id).first()
    if not stats:
        stats = CandidateCodingStats(candidate_id=current_user.id)
        db.add(stats)

    if status_enum == SubmissionStatus.ACCEPTED:
        prev_accepted = db.query(CandidateSubmission).filter(
            CandidateSubmission.candidate_id == current_user.id,
            CandidateSubmission.problem_id == problem.id,
            CandidateSubmission.status == SubmissionStatus.ACCEPTED
        ).count()

        # Idempotent scoring: Award points ONLY on first accepted solve
        if prev_accepted == 1:
            stats.total_solved += 1
            diff_val = problem.difficulty.value if hasattr(problem.difficulty, 'value') else problem.difficulty
            if diff_val == "Easy":
                stats.easy_solved += 1
                stats.total_score += 100
            elif diff_val == "Medium":
                stats.medium_solved += 1
                stats.total_score += 200
            elif diff_val == "Hard":
                stats.hard_solved += 300
                stats.total_score += 300

    db.commit()

    # Trigger AI Review
    ai_res = ai_coding_service.review_submission(
        problem_title=problem.title,
        code=req.code,
        language=req.language,
        verdict=overall_status,
        runtime_sec=total_time
    )

    ai_review = AIReview(
        submission_id=submission.id,
        time_complexity=ai_res["time_complexity"],
        space_complexity=ai_res["space_complexity"],
        code_quality_score=ai_res["code_quality_score"],
        correctness_feedback=ai_res["correctness_feedback"],
        strengths=ai_res["strengths"],
        weaknesses=ai_res["weaknesses"],
        optimization_suggestions=ai_res["optimization_suggestions"]
    )
    db.add(ai_review)
    db.commit()

    return {
        "submission_id": str(submission.id),
        "status": overall_status,
        "passed_test_cases": passed_count,
        "total_test_cases": len(test_cases),
        "execution_time": round(total_time, 3),
        "score": stats.total_score if stats else 0,
        "error_message": first_error,
        "ai_review": ai_res
    }


@router.post("/ai/hint")
def get_ai_hint(req: AIHintRequest, db: Session = Depends(get_db)):
    """Get progressive 3-level AI hints."""
    problem = db.query(CodingProblem).filter(CodingProblem.id == req.problem_id).first()
    title = problem.title if problem else "Coding Problem"
    desc = problem.description if problem else ""
    return ai_coding_service.generate_hint(title, desc, req.code, req.hint_level or 1)


@router.post("/ai/explain-error")
def explain_code_error(req: AIErrorExplainRequest):
    """Explain compiler / runtime traceback errors."""
    return ai_coding_service.explain_error(req.code, req.error_message, req.language)


@router.get("/recommendations")
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized weak-topic problem recommendations."""
    stats = db.query(CandidateCodingStats).filter(CandidateCodingStats.candidate_id == current_user.id).first()
    stats_dict = {"total_solved": stats.total_solved if stats else 0}
    return ai_coding_service.get_recommendations([], stats_dict)


@router.get("/submissions")
def get_submissions_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve user submission history."""
    subs = db.query(CandidateSubmission).filter(
        CandidateSubmission.candidate_id == current_user.id
    ).order_by(CandidateSubmission.submitted_at.desc()).limit(20).all()

    result = []
    for s in subs:
        p = db.query(CodingProblem).filter(CodingProblem.id == s.problem_id).first()
        result.append({
            "id": str(s.id),
            "problem_title": p.title if p else "Problem",
            "language": s.language,
            "status": s.status.value if hasattr(s.status, 'value') else s.status,
            "passed_test_cases": s.passed_test_cases,
            "total_test_cases": s.total_test_cases,
            "execution_time_seconds": s.execution_time_seconds,
            "submitted_at": s.submitted_at.isoformat(),
        })
    return result


@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    """Get global coding leaderboard."""
    stats_list = db.query(CandidateCodingStats).order_by(CandidateCodingStats.total_score.desc()).limit(50).all()
    result = []
    for idx, s in enumerate(stats_list, start=1):
        user = db.query(User).filter(User.id == s.candidate_id).first()
        result.append({
            "rank": idx,
            "candidate_name": user.full_name if user else "Candidate",
            "total_solved": s.total_solved,
            "easy_solved": s.easy_solved,
            "medium_solved": s.medium_solved,
            "hard_solved": s.hard_solved,
            "total_score": s.total_score,
            "streak": s.current_streak,
        })
    return result
