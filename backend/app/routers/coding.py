from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
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
    CodingUserProgress,
    WeeklyAssessment,
    RecruiterAssessment,
    RecruiterAssessmentAttempt,
    RecruiterAssessmentAnswer,
    Language,
    AIReview,
    ProblemDifficulty,
    SubmissionStatus
)
from app.models.job import Job
from app.models.application import Application
from app.middleware.auth_middleware import get_current_user, require_role, get_optional_current_user
from app.services.ai_coding_service import ai_coding_service
from app.services.dataset_importer import seed_default_problems, import_huggingface_dataset

router = APIRouter(prefix="/api/coding", tags=["Coding Assessment & IDE"])

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
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve paginated problem list with optional candidate solved status."""
    query = db.query(CodingProblem).filter(CodingProblem.is_active == True)
    
    if category and category != "All":
        query = query.filter(CodingProblem.category == category)
    if difficulty and difficulty != "All":
        query = query.filter(CodingProblem.difficulty == difficulty)
    if search:
        query = query.filter(CodingProblem.title.ilike(f"%{search}%"))

    problems = query.all()

    # If candidate is authenticated, fetch their progress per problem
    solved_problem_ids = set()
    attempted_problem_ids = set()
    if current_user:
        progs = db.query(CodingUserProgress).filter(CodingUserProgress.user_id == current_user.id).all()
        for p in progs:
            if p.status == "SOLVED":
                solved_problem_ids.add(p.problem_id)
            elif p.attempts and p.attempts > 0:
                attempted_problem_ids.add(p.problem_id)

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
            "is_solved": p.id in solved_problem_ids,
            "is_attempted": p.id in attempted_problem_ids or p.id in solved_problem_ids,
        }
        for p in problems
    ]


def generate_starter_codes(problem):
    func_name = problem.function_name or "twoSum"
    slug = problem.slug or ""
    
    classic_mappings = {
        "two-sum": ("twoSum", "nums: list[int], target: int", "list[int]", "int[]", "int[] nums, int target", "vector<int>", "vector<int>& nums, int target"),
        "climbing-stairs": ("climbStairs", "n: int", "int", "int", "int n", "int", "int n"),
        "longest-substring-without-repeating-characters": ("lengthOfLongestSubstring", "s: str", "int", "int", "String s", "int", "string s"),
        "best-time-to-buy-and-sell-stock": ("maxProfit", "prices: list[int]", "int", "int", "int[] prices", "int", "vector<int>& prices"),
        "number-of-islands": ("numIslands", "grid: list[list[str]]", "int", "int", "char[][] grid", "int", "vector<vector<char>>& grid"),
        "3sum": ("threeSum", "nums: list[int]", "list[list[int]]", "List<List<Integer>>", "int[] nums", "vector<vector<int>>", "vector<int>& nums"),
        "valid-anagram": ("isAnagram", "s: str, t: str", "bool", "boolean", "String s, String t", "bool", "string s, string t"),
        "reverse-linked-list": ("reverseList", "head: Optional[ListNode]", "Optional[ListNode]", "ListNode", "ListNode head", "ListNode*", "ListNode* head"),
        "valid-parentheses": ("isValid", "s: str", "bool", "boolean", "String s", "bool", "string s"),
        "merge-two-sorted-lists": ("mergeTwoLists", "list1: Optional[ListNode], list2: Optional[ListNode]", "Optional[ListNode]", "ListNode", "ListNode list1, ListNode list2", "ListNode*", "ListNode* list1, ListNode* list2"),
        "maximum-subarray": ("maxSubArray", "nums: list[int]", "int", "int", "int[] nums", "int", "vector<int>& nums"),
        "binary-search": ("search", "nums: list[int], target: int", "int", "int", "int[] nums, int target", "int", "vector<int>& nums, int target"),
        "container-with-most-water": ("maxArea", "height: list[int]", "int", "int", "int[] height", "int", "vector<int>& height"),
        "valid-palindrome": ("isPalindrome", "s: str", "bool", "boolean", "String s", "bool", "string s"),
        "search-in-rotated-sorted-array": ("search", "nums: list[int], target: int", "int", "int", "int[] nums, int target", "int", "vector<int>& nums, int target"),
        "maximum-depth-of-binary-tree": ("maxDepth", "root: Optional[TreeNode]", "int", "int", "TreeNode root", "int", "TreeNode* root"),
        "invert-binary-tree": ("invertTree", "root: Optional[TreeNode]", "Optional[TreeNode]", "TreeNode", "TreeNode root", "TreeNode*", "TreeNode* root"),
        "coin-change": ("coinChange", "coins: list[int], amount: int", "int", "int", "int[] coins, int amount", "int", "vector<int>& coins, int amount"),
        "jump-game": ("canJump", "nums: list[int]", "bool", "boolean", "int[] nums", "bool", "vector<int>& nums"),
        "subsets": ("subsets", "nums: list[int]", "list[list[int]]", "List<List<Integer>>", "int[] nums", "vector<vector<int>>", "vector<int>& nums"),
        "course-schedule": ("canFinish", "numCourses: int, prerequisites: list[list[int]]", "bool", "boolean", "int numCourses, int[][] prerequisites", "bool", "int numCourses, vector<vector<int>>& prerequisites"),
        "min-stack": ("MinStack", "", "", "", "", "", ""),
    }

    if slug in classic_mappings:
        f_name, py_args, py_ret, java_ret, java_args, cpp_ret, cpp_args = classic_mappings[slug]
    else:
        f_name = func_name
        sample = (problem.sample_input or "").strip()
        py_args = "nums: list[int]"
        py_ret = "int"
        java_args = "int[] nums"
        java_ret = "int"
        cpp_args = "vector<int>& nums"
        cpp_ret = "int"
        
        if sample:
            if sample.startswith("[[") or (sample.startswith("[") and ("[" in sample[1:10])):
                py_args = "grid: list[list[str]]"
                java_args = "char[][] grid"
                cpp_args = "vector<vector<char>>& grid"
            elif "=" in sample:
                var_names = []
                for part in sample.split(","):
                    if "=" in part:
                        var_names.append(part.split("=")[0].strip())
                if len(var_names) >= 2:
                    py_args = f"{var_names[0]}: list[int], {var_names[1]}: int"
                    java_args = f"int[] {var_names[0]}, int {var_names[1]}"
                    cpp_args = f"vector<int>& {var_names[0]}, int {var_names[1]}"
            elif sample.startswith('"') or sample.startswith("'") or (len(sample) > 2 and not sample.replace("-","").isdigit() and not sample.startswith("[")):
                py_args = "s: str"
                java_args = "String s"
                cpp_args = "string s"
            elif sample.replace("-", "").isdigit():
                py_args = "n: int"
                java_args = "int n"
                cpp_args = "int n"
            elif sample.startswith("["):
                py_args = "nums: list[int]"
                java_args = "int[] nums"
                cpp_args = "vector<int>& nums"

    py_code = f"class Solution:\n    def {f_name}(self, {py_args}) -> {py_ret}:\n        # Write your algorithm here\n        pass\n"
    
    if f_name == "MinStack":
        java_code = "class MinStack {\n    public MinStack() {\n    }\n    public void push(int val) {\n    }\n    public void pop() {\n    }\n    public int top() {\n        return 0;\n    }\n    public int getMin() {\n        return 0;\n    }\n}\n"
        py_code = "class MinStack:\n    def __init__(self):\n        pass\n    def push(self, val: int) -> None:\n        pass\n    def pop(self) -> None:\n        pass\n    def top(self) -> int:\n        return 0\n    def getMin(self) -> int:\n        return 0\n"
        cpp_code = "class MinStack {\npublic:\n    MinStack() {\n    }\n    void push(int val) {\n    }\n    void pop() {\n    }\n    int top() {\n        return 0;\n    }\n    int getMin() {\n        return 0;\n    }\n};\n"
    else:
        fallback_val = '0' if java_ret == 'int' else 'false' if java_ret == 'boolean' else 'new int[]{}' if '[]' in java_ret else 'null'
        java_code = f"class Solution {{\n    public {java_ret} {f_name}({java_args}) {{\n        // Write your solution\n        return {fallback_val};\n    }}\n}}\n"
        cpp_code = f"class Solution {{\npublic:\n    {cpp_ret} {f_name}({cpp_args}) {{\n        return {{}};\n    }}\n}};\n"
        
    js_args = ', '.join(arg.split(':')[0].strip() for arg in py_args.split(',') if arg)
    js_fallback = '[]' if 'list' in py_ret else '0' if py_ret == 'int' else 'false'
    js_code = f"class Solution {{\n    {f_name}({js_args}) {{\n        // Write your solution\n        return {js_fallback};\n    }}\n}}\n"

    return py_code, java_code, cpp_code, js_code


@router.get("/problems/{problem_id}")
def get_problem_detail(
    problem_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Get single problem detail with public sample testcases and candidate's saved solution code if exists."""
    problem = db.query(CodingProblem).filter(CodingProblem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    sample_tests = db.query(TestCase).filter(TestCase.problem_id == problem.id, TestCase.is_hidden == False).all()

    py_code, java_code, cpp_code, js_code = generate_starter_codes(problem)

    saved_code = None
    saved_language = None
    is_solved = False
    attempts = 0
    submissions_list = []

    if current_user:
        submissions = db.query(CandidateSubmission).filter(
            CandidateSubmission.candidate_id == current_user.id,
            CandidateSubmission.problem_id == problem.id
        ).order_by(CandidateSubmission.submitted_at.desc()).all()

        attempts = len(submissions)
        last_accepted = next((s for s in submissions if s.status == SubmissionStatus.ACCEPTED), None)
        is_solved = last_accepted is not None
        
        if last_accepted:
            saved_code = last_accepted.code
            saved_language = last_accepted.language
        elif submissions:
            saved_code = submissions[0].code
            saved_language = submissions[0].language

        submissions_list = [
            {
                "id": str(s.id),
                "language": s.language,
                "code": s.code,
                "status": s.status.value if hasattr(s.status, "value") else str(s.status),
                "passed_test_cases": s.passed_test_cases,
                "total_test_cases": s.total_test_cases,
                "execution_time": s.execution_time_seconds,
                "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None
            }
            for s in submissions
        ]

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
        "starter_code_python": py_code,
        "starter_code_java": java_code,
        "starter_code_cpp": cpp_code,
        "starter_code_javascript": js_code,
        "saved_code": saved_code,
        "saved_language": saved_language,
        "is_solved": is_solved,
        "attempts": attempts,
        "user_submissions": submissions_list,
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

    from app.services.code_execution.docker_executor import DockerExecutor
    executor = DockerExecutor(time_limit_seconds=problem.time_limit_seconds or 2.0, memory_limit_mb=problem.memory_limit_mb or 256)
    
    run_res = executor.run_code(req.language, req.code, sample_tests, problem.function_name or "twoSum")
    
    test_results = []
    for idx, r in enumerate(run_res.get("test_results", []), start=1):
        tc = sample_tests[idx-1] if idx-1 < len(sample_tests) else None
        test_results.append({
            "number": idx,
            "status": r["status"],
            "input": tc.input_data if tc else "",
            "expected_output": tc.expected_output if tc else "",
            "actual_output": r.get("actual") or run_res.get("error_message") or "",
            "execution_time": run_res.get("execution_time", 0.0) / len(sample_tests) if sample_tests else 0.0,
        })
        
    return {
        "status": run_res["status"],
        "passed_test_cases": run_res["passed_test_cases"],
        "total_test_cases": run_res["total_test_cases"],
        "execution_time": run_res["execution_time"],
        "test_cases": test_results
    }


def get_candidate_coding_rank(db: Session, candidate_id):
    """Compute 1-based global rank for a candidate based on points and solved count."""
    stats = db.query(CandidateCodingStats).filter(CandidateCodingStats.candidate_id == candidate_id).first()
    if not stats or (stats.total_score == 0 and stats.total_solved == 0):
        return None
    
    higher_candidates = db.query(CandidateCodingStats).join(User, CandidateCodingStats.candidate_id == User.id).filter(
        User.role == UserRole.CANDIDATE,
        (CandidateCodingStats.total_score > stats.total_score) |
        ((CandidateCodingStats.total_score == stats.total_score) & (CandidateCodingStats.total_solved > stats.total_solved))
    ).count()
    return higher_candidates + 1


def sync_candidate_coding_stats(db: Session, candidate_id) -> Dict[str, Any]:
    """Calculate and sync candidate coding statistics from CodingUserProgress and CandidateSubmission."""
    # 1. Auto-reconcile CodingUserProgress from CandidateSubmission records
    user_submissions = db.query(CandidateSubmission).filter(
        CandidateSubmission.candidate_id == candidate_id
    ).order_by(CandidateSubmission.submitted_at.asc()).all()

    submissions_by_problem = {}
    for sub in user_submissions:
        if sub.problem_id not in submissions_by_problem:
            submissions_by_problem[sub.problem_id] = []
        submissions_by_problem[sub.problem_id].append(sub)

    for problem_id, subs in submissions_by_problem.items():
        prog = db.query(CodingUserProgress).filter(
            CodingUserProgress.user_id == candidate_id,
            CodingUserProgress.problem_id == problem_id
        ).first()

        problem = db.query(CodingProblem).filter(CodingProblem.id == problem_id).first()
        if not problem:
            continue

        attempts = len(subs)
        accepted_subs = [s for s in subs if s.status == SubmissionStatus.ACCEPTED]
        is_solved = len(accepted_subs) > 0
        diff = problem.difficulty.value if hasattr(problem.difficulty, 'value') else str(problem.difficulty)
        points_per_diff = 100 if diff == "Easy" else 200 if diff == "Medium" else 300
        points_awarded = points_per_diff if is_solved else 0
        first_accepted_at = accepted_subs[0].submitted_at if accepted_subs else None
        last_sub_id = subs[-1].id

        if not prog:
            prog = CodingUserProgress(
                user_id=candidate_id,
                problem_id=problem_id,
                status="SOLVED" if is_solved else "ATTEMPTED",
                attempts=attempts,
                accepted_attempts=len(accepted_subs),
                points_awarded=points_awarded,
                solved_at=first_accepted_at,
                last_submission_id=last_sub_id
            )
            db.add(prog)
        else:
            prog.attempts = max(prog.attempts or 0, attempts)
            prog.accepted_attempts = max(prog.accepted_attempts or 0, len(accepted_subs))
            if is_solved:
                prog.status = "SOLVED"
                prog.points_awarded = points_per_diff
                if not prog.solved_at:
                    prog.solved_at = first_accepted_at
            prog.last_submission_id = last_sub_id

    db.commit()

    # 2. Total unique problems attempted
    attempted_count = db.query(CodingUserProgress).filter(
        CodingUserProgress.user_id == candidate_id
    ).count()

    # 3. Total unique problems solved
    solved_progress = db.query(CodingUserProgress).join(
        CodingProblem, CodingUserProgress.problem_id == CodingProblem.id
    ).filter(
        CodingUserProgress.user_id == candidate_id,
        CodingUserProgress.status == "SOLVED"
    ).all()

    total_solved = len(solved_progress)
    easy_solved = 0
    medium_solved = 0
    hard_solved = 0
    total_points = 0

    for p in solved_progress:
        total_points += (p.points_awarded or 0)
        diff = p.problem.difficulty.value if hasattr(p.problem.difficulty, 'value') else p.problem.difficulty
        if diff == "Easy":
            easy_solved += 1
        elif diff == "Medium":
            medium_solved += 1
        elif diff == "Hard":
            hard_solved += 1

    # 4. Overall Accuracy percentage based on all submissions
    total_submissions = len(user_submissions)
    accepted_submissions = sum(1 for s in user_submissions if s.status == SubmissionStatus.ACCEPTED)
    accuracy = round((accepted_submissions / max(1, total_submissions)) * 100.0, 1) if total_submissions > 0 else 0.0

    # 5. Upsert CandidateCodingStats
    stats = db.query(CandidateCodingStats).filter(CandidateCodingStats.candidate_id == candidate_id).first()
    if not stats:
        stats = CandidateCodingStats(candidate_id=candidate_id)
        db.add(stats)

    stats.total_solved = total_solved
    stats.easy_solved = easy_solved
    stats.medium_solved = medium_solved
    stats.hard_solved = hard_solved
    stats.total_score = total_points
    stats.accuracy_percentage = accuracy
    stats.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(stats)

    # 6. Global Rank
    rank = get_candidate_coding_rank(db, candidate_id)
    stats.global_rank = rank
    db.commit()

    return {
        "candidate_id": str(candidate_id),
        "problems_solved": total_solved,
        "problems_attempted": attempted_count,
        "easy_solved": easy_solved,
        "medium_solved": medium_solved,
        "hard_solved": hard_solved,
        "total_points": total_points,
        "accuracy": accuracy,
        "rank": rank
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

    from app.services.code_execution.docker_executor import DockerExecutor
    executor = DockerExecutor(time_limit_seconds=problem.time_limit_seconds or 2.0, memory_limit_mb=problem.memory_limit_mb or 256)
    
    run_res = executor.run_code(req.language, req.code, test_cases, problem.function_name or "twoSum")
    passed_count = run_res["passed_test_cases"]
    total_time = run_res["execution_time"]
    overall_status = run_res["status"]
    first_error = run_res["error_message"]
    first_token = None

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

    # Upsert CodingUserProgress record
    progress = db.query(CodingUserProgress).filter(
        CodingUserProgress.user_id == current_user.id,
        CodingUserProgress.problem_id == problem.id
    ).first()

    if not progress:
        progress = CodingUserProgress(
            user_id=current_user.id,
            problem_id=problem.id,
            status="ATTEMPTED",
            attempts=0,
            accepted_attempts=0,
            points_awarded=0
        )
        db.add(progress)

    progress.attempts += 1
    progress.last_submission_id = submission.id

    if status_enum == SubmissionStatus.ACCEPTED:
        progress.accepted_attempts += 1
        # Award points ONLY once on first ACCEPTED solution (Idempotency)
        if progress.status != "SOLVED":
            progress.status = "SOLVED"
            progress.solved_at = datetime.utcnow()
            diff_val = problem.difficulty.value if hasattr(problem.difficulty, 'value') else problem.difficulty
            if diff_val == "Easy":
                progress.points_awarded = 100
            elif diff_val == "Medium":
                progress.points_awarded = 200
            elif diff_val == "Hard":
                progress.points_awarded = 300
            else:
                progress.points_awarded = 100

    db.commit()

    # Calculate and sync candidate coding statistics
    coding_stats = sync_candidate_coding_stats(db, current_user.id)

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
        "score": coding_stats["total_points"],
        "problems_solved": coding_stats["problems_solved"],
        "accuracy": coding_stats["accuracy"],
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
    """Get global coding leaderboard for registered candidates."""
    stats_list = (
        db.query(CandidateCodingStats)
        .join(User, CandidateCodingStats.candidate_id == User.id)
        .filter(User.role == UserRole.CANDIDATE, (CandidateCodingStats.total_score > 0) | (CandidateCodingStats.total_solved > 0))
        .order_by(CandidateCodingStats.total_score.desc(), CandidateCodingStats.total_solved.desc())
        .limit(50)
        .all()
    )
    result = []
    for idx, s in enumerate(stats_list, start=1):
        user = db.query(User).filter(User.id == s.candidate_id).first()
        result.append({
            "rank": idx,
            "candidate_id": str(s.candidate_id),
            "candidate_name": user.full_name if user and user.full_name else f"Candidate {idx}",
            "total_solved": s.total_solved or 0,
            "problems_solved": s.total_solved or 0,
            "easy_solved": s.easy_solved or 0,
            "medium_solved": s.medium_solved or 0,
            "hard_solved": s.hard_solved or 0,
            "total_score": s.total_score or 0,
            "total_points": s.total_score or 0,
            "accuracy": s.accuracy_percentage or 0.0,
            "streak": s.current_streak or 0,
        })
    return result


# --- NEW SCHEMAS AND ENDPOINTS FOR RECRUITER CODING ASSESSMENT ---

class AnswerSubmitItem(BaseModel):
    problem_id: str
    language: str
    code: str


class AssessmentSubmitRequest(BaseModel):
    answers: List[AnswerSubmitItem]


class JobLinkAssessmentRequest(BaseModel):
    assessment_id: str


@router.get("/problems/{problem_id}/progress")
def get_problem_progress(
    problem_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve current candidate's submission progress on a specific problem."""
    submissions = db.query(CandidateSubmission).filter(
        CandidateSubmission.candidate_id == current_user.id,
        CandidateSubmission.problem_id == problem_id
    ).order_by(CandidateSubmission.submitted_at.desc()).all()

    solved = any(s.status == SubmissionStatus.ACCEPTED for s in submissions)
    attempts = len(submissions)
    best_time = min((s.execution_time_seconds for s in submissions if s.execution_time_seconds is not None), default=0.0)

    last_accepted = next((s for s in submissions if s.status == SubmissionStatus.ACCEPTED), None)
    saved_code = last_accepted.code if last_accepted else (submissions[0].code if submissions else None)
    saved_language = last_accepted.language if last_accepted else (submissions[0].language if submissions else None)

    return {
        "solved": solved,
        "attempts": attempts,
        "best_time_seconds": best_time,
        "saved_code": saved_code,
        "saved_language": saved_language,
        "submissions": [
            {
                "id": str(s.id),
                "language": s.language,
                "code": s.code,
                "status": s.status.value if hasattr(s.status, "value") else str(s.status),
                "passed_test_cases": s.passed_test_cases,
                "total_test_cases": s.total_test_cases,
                "execution_time": s.execution_time_seconds,
                "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None
            }
            for s in submissions
        ]
    }


@router.get("/profile")
def get_coding_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve detailed coding profile stats for candidate dashboard & profile."""
    stats_data = sync_candidate_coding_stats(db, current_user.id)
    
    recent = db.query(CandidateSubmission).filter(
        CandidateSubmission.candidate_id == current_user.id
    ).order_by(CandidateSubmission.submitted_at.desc()).limit(5).all()

    problems_dict = {}
    for s in recent:
        prob = db.query(CodingProblem).filter(CodingProblem.id == s.problem_id).first()
        if prob:
            problems_dict[s.problem_id] = prob.title

    return {
        "candidate_id": str(current_user.id),
        "total_score": stats_data["total_points"],
        "total_points": stats_data["total_points"],
        "points": stats_data["total_points"],
        "total_solved": stats_data["problems_solved"],
        "problems_solved": stats_data["problems_solved"],
        "problems_attempted": stats_data["problems_attempted"],
        "easy_solved": stats_data["easy_solved"],
        "medium_solved": stats_data["medium_solved"],
        "hard_solved": stats_data["hard_solved"],
        "accuracy": stats_data["accuracy"],
        "rank": stats_data["rank"],
        "current_streak": 0,
        "recent_submissions": [
            {
                "id": str(s.id),
                "problem_title": problems_dict.get(s.problem_id, "Problem"),
                "language": s.language,
                "status": s.status.value if hasattr(s.status, "value") else s.status,
                "submitted_at": s.submitted_at.isoformat()
            }
            for s in recent
        ]
    }


@router.post("/assessments")
def create_recruiter_assessment(
    req: RecruiterAssessmentCreate,
    current_user: User = Depends(require_role(UserRole.RECRUITER)),
    db: Session = Depends(get_db)
):
    """Recruiter API: Create a new custom coding assessment."""
    assessment = RecruiterAssessment(
        recruiter_id=current_user.id,
        title=req.title,
        target_role=req.target_role,
        difficulty=req.difficulty,
        problem_ids=req.problem_ids,
        time_limit_minutes=req.time_limit_minutes,
        passing_score=req.passing_score
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return {
        "id": str(assessment.id),
        "title": assessment.title,
        "target_role": assessment.target_role,
        "time_limit_minutes": assessment.time_limit_minutes
    }


@router.get("/assessments")
def get_assessments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve coding assessments list. For recruiters, returns their created assessments. For candidates, returns assigned/linked assessments."""
    if current_user.role == UserRole.RECRUITER:
        assessments = db.query(RecruiterAssessment).filter(RecruiterAssessment.recruiter_id == current_user.id).all()
    else:
        # Candidate: Fetch linked assessments through applications
        apps = db.query(Application).filter(Application.candidate_id == current_user.id).all()
        job_ids = [a.job_id for a in apps if a.job_id]
        if not job_ids:
            return []
        jobs = db.query(Job).filter(Job.id.in_(job_ids), Job.assessment_id != None).all()
        assessment_ids = [j.assessment_id for j in jobs if j.assessment_id]
        if not assessment_ids:
            return []
        assessments = db.query(RecruiterAssessment).filter(RecruiterAssessment.id.in_(assessment_ids)).all()

    return [
        {
            "id": str(a.id),
            "title": a.title,
            "target_role": a.target_role,
            "difficulty": a.difficulty,
            "time_limit_minutes": a.time_limit_minutes,
            "passing_score": a.passing_score,
            "problem_count": len(a.problem_ids or [])
        }
        for a in assessments
    ]


@router.get("/assessments/{assessment_id}")
def get_assessment_details(
    assessment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get coding assessment and its problems details."""
    assessment = db.query(RecruiterAssessment).filter(RecruiterAssessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if current_user.role == UserRole.CANDIDATE:
        apps = db.query(Application).filter(Application.candidate_id == current_user.id).all()
        job_ids = [a.job_id for a in apps if a.job_id]
        linked_job = db.query(Job).filter(Job.id.in_(job_ids), Job.assessment_id == assessment.id).first() if job_ids else None
        if not linked_job:
            raise HTTPException(status_code=403, detail="You must apply for the associated job posting before accessing this coding assessment.")

    problems = db.query(CodingProblem).filter(CodingProblem.id.in_(assessment.problem_ids)).all()

    # Check if candidate has already started/submitted an attempt
    attempt = db.query(RecruiterAssessmentAttempt).filter(
        RecruiterAssessmentAttempt.assessment_id == assessment.id,
        RecruiterAssessmentAttempt.candidate_id == current_user.id
    ).first()

    return {
        "id": str(assessment.id),
        "title": assessment.title,
        "target_role": assessment.target_role,
        "time_limit_minutes": assessment.time_limit_minutes,
        "passing_score": assessment.passing_score,
        "attempt_status": attempt.status if attempt else None,
        "attempt_id": str(attempt.id) if attempt else None,
        "started_at": attempt.started_at.isoformat() if attempt else None,
        "problems": [
            {
                "id": str(p.id),
                "title": p.title,
                "difficulty": p.difficulty.value if hasattr(p.difficulty, 'value') else p.difficulty,
                "category": p.category,
                "description": p.description,
                "constraints": p.constraints,
                "sample_input": p.sample_input,
                "sample_output": p.sample_output,
                "function_name": p.function_name
            }
            for p in problems
        ]
    }


@router.post("/assessments/{assessment_id}/start")
def start_assessment_attempt(
    assessment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start assessment timer and create a candidate attempt record."""
    assessment = db.query(RecruiterAssessment).filter(RecruiterAssessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if current_user.role == UserRole.CANDIDATE:
        apps = db.query(Application).filter(Application.candidate_id == current_user.id).all()
        job_ids = [a.job_id for a in apps if a.job_id]
        linked_job = db.query(Job).filter(Job.id.in_(job_ids), Job.assessment_id == assessment.id).first() if job_ids else None
        if not linked_job:
            raise HTTPException(status_code=403, detail="You must apply for the associated job posting before starting this coding assessment.")

    # Prevent re-starting completed assessments
    existing = db.query(RecruiterAssessmentAttempt).filter(
        RecruiterAssessmentAttempt.assessment_id == assessment_id,
        RecruiterAssessmentAttempt.candidate_id == current_user.id
    ).first()

    if existing:
        if existing.status == "submitted":
            raise HTTPException(status_code=400, detail="Assessment already submitted")
        return {
            "attempt_id": str(existing.id),
            "started_at": existing.started_at.isoformat(),
            "status": existing.status
        }

    attempt = RecruiterAssessmentAttempt(
        assessment_id=assessment.id,
        candidate_id=current_user.id,
        status="started",
        started_at=datetime.utcnow()
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "attempt_id": str(attempt.id),
        "started_at": attempt.started_at.isoformat(),
        "status": attempt.status
    }


@router.post("/assessments/{assessment_id}/submit")
def submit_assessment_attempt(
    assessment_id: str,
    req: AssessmentSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Grade coding assessment submissions, record answers, calculate candidate final score and trigger metrics update."""
    assessment = db.query(RecruiterAssessment).filter(RecruiterAssessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if current_user.role == UserRole.CANDIDATE:
        apps = db.query(Application).filter(Application.candidate_id == current_user.id).all()
        job_ids = [a.job_id for a in apps if a.job_id]
        linked_job = db.query(Job).filter(Job.id.in_(job_ids), Job.assessment_id == assessment.id).first() if job_ids else None
        if not linked_job:
            raise HTTPException(status_code=403, detail="You must apply for the associated job posting before submitting this coding assessment.")

    attempt = db.query(RecruiterAssessmentAttempt).filter(
        RecruiterAssessmentAttempt.assessment_id == assessment_id,
        RecruiterAssessmentAttempt.candidate_id == current_user.id,
        RecruiterAssessmentAttempt.status == "started"
    ).first()

    if not attempt:
        raise HTTPException(status_code=400, detail="No active attempt found for this assessment")

    from app.services.code_execution.docker_executor import DockerExecutor
    executor = DockerExecutor()

    total_weight_score = 0.0
    problems_count = len(assessment.problem_ids)
    points_per_problem = 100.0 / max(1, problems_count)

    # Process and grade each submitted code file
    for answer_item in req.answers:
        prob = db.query(CodingProblem).filter(CodingProblem.id == answer_item.problem_id).first()
        if not prob:
            continue

        test_cases = db.query(TestCase).filter(TestCase.problem_id == prob.id).all()
        if not test_cases:
            test_cases = [TestCase(input_data=prob.sample_input or "", expected_output=prob.sample_output or "")]

        # Run inside isolated sandbox container
        grade_res = executor.run_code(answer_item.language, answer_item.code, test_cases, prob.function_name or "twoSum")
        passed = grade_res.get("passed_test_cases", 0)
        total = grade_res.get("total_test_cases", len(test_cases))

        # Calculate problem partial or full points
        earned_points = (passed / max(1, total)) * points_per_problem
        total_weight_score += earned_points

        # Save submission record
        sub_status = SubmissionStatus.ACCEPTED if grade_res["status"] == "Accepted" else SubmissionStatus.WRONG_ANSWER
        if grade_res["status"] == "Compilation Error":
            sub_status = SubmissionStatus.COMPILATION_ERROR
        elif grade_res["status"] == "Time Limit Exceeded":
            sub_status = SubmissionStatus.TIME_LIMIT_EXCEEDED
        elif grade_res["status"] == "Runtime Error":
            sub_status = SubmissionStatus.RUNTIME_ERROR

        submission = CandidateSubmission(
            candidate_id=current_user.id,
            problem_id=prob.id,
            language=answer_item.language,
            code=answer_item.code,
            status=sub_status,
            execution_time_seconds=grade_res.get("execution_time", 0.0),
            passed_test_cases=passed,
            total_test_cases=total,
            error_message=grade_res.get("error_message")
        )
        db.add(submission)
        db.flush()

        # Save answer item
        answer_record = RecruiterAssessmentAnswer(
            attempt_id=attempt.id,
            problem_id=prob.id,
            language=answer_item.language,
            source_code=answer_item.code,
            submission_id=submission.id,
            points_awarded=round(earned_points, 1),
            status=grade_res["status"]
        )
        db.add(answer_record)

    # Save attempt final scores
    attempt.submitted_at = datetime.utcnow()
    attempt.status = "submitted"
    attempt.score = round(total_weight_score, 1)
    attempt.time_taken_seconds = int((attempt.submitted_at - attempt.started_at).total_seconds())

    # Dynamically update overall candidate scores for all jobs that use this assessment
    from app.services.candidate_scoring_service import candidate_scoring_service
    linked_jobs = db.query(Job).filter(Job.assessment_id == assessment_id).all()
    for job in linked_jobs:
        # Trigger full evaluation recalculation instantly
        candidate_scoring_service.evaluate_candidate_for_job(db, current_user.id, job.id)

    db.commit()

    return {
        "status": "success",
        "score": attempt.score,
        "time_taken_seconds": attempt.time_taken_seconds
    }


@router.get("/recruiter/candidates/{candidate_id}/coding")
def get_candidate_coding_details(
    candidate_id: str,
    current_user: User = Depends(require_role(UserRole.RECRUITER)),
    db: Session = Depends(get_db)
):
    """Recruiter API: Fetch specific candidate profile coding metrics & submission history."""
    stats = db.query(CandidateCodingStats).filter(CandidateCodingStats.candidate_id == candidate_id).first()
    recent = db.query(CandidateSubmission).filter(
        CandidateSubmission.candidate_id == candidate_id
    ).order_by(CandidateSubmission.submitted_at.desc()).limit(10).all()

    problems_dict = {}
    for s in recent:
        prob = db.query(CodingProblem).filter(CodingProblem.id == s.problem_id).first()
        if prob:
            problems_dict[s.problem_id] = prob.title

    return {
        "total_score": stats.total_score if stats else 0,
        "total_solved": stats.total_solved if stats else 0,
        "easy_solved": stats.easy_solved if stats else 0,
        "medium_solved": stats.medium_solved if stats else 0,
        "hard_solved": stats.hard_solved if stats else 0,
        "recent_submissions": [
            {
                "problem_title": problems_dict.get(s.problem_id, "Problem"),
                "language": s.language,
                "status": s.status.value if hasattr(s.status, "value") else s.status,
                "execution_time_seconds": s.execution_time_seconds,
                "passed_test_cases": s.passed_test_cases,
                "total_test_cases": s.total_test_cases,
                "submitted_at": s.submitted_at.isoformat()
            }
            for s in recent
        ]
    }


@router.get("/recruiter/jobs/{job_id}/coding-results")
def get_job_coding_assessment_results(
    job_id: str,
    current_user: User = Depends(require_role(UserRole.RECRUITER)),
    db: Session = Depends(get_db)
):
    """Recruiter API: Retrieve coding assessment scores of all applicants for a job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job or not job.assessment_id:
        return []

    attempts = db.query(RecruiterAssessmentAttempt).filter(
        RecruiterAssessmentAttempt.assessment_id == job.assessment_id,
        RecruiterAssessmentAttempt.status == "submitted"
    ).all()

    results = []
    for att in attempts:
        user = db.query(User).filter(User.id == att.candidate_id).first()
        if not user:
            continue
        results.append({
            "candidate_id": str(user.id),
            "candidate_name": user.full_name,
            "email": user.email,
            "score": att.score,
            "time_taken_seconds": att.time_taken_seconds,
            "submitted_at": att.submitted_at.isoformat()
        })
    return results


@router.post("/recruiter/jobs/{job_id}/assessment")
def link_job_coding_assessment(
    job_id: str,
    req: JobLinkAssessmentRequest,
    current_user: User = Depends(require_role(UserRole.RECRUITER)),
    db: Session = Depends(get_db)
):
    """Recruiter API: Link a coding assessment to a specific Job Posting."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.assessment_id = assessment.id
    db.commit()

    return {
        "status": "success",
        "job_id": str(job.id),
        "assessment_id": str(assessment.id),
        "assessment_title": assessment.title
    }


class AIHintRequest(BaseModel):
    problem_id: str
    code: Optional[str] = ""
    hint_level: Optional[int] = 1


@router.post("/hint")
@router.post("/ai/hint")
def get_ai_coding_hint(
    req: AIHintRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Provide progressive algorithmic AI hints for coding problems."""
    problem = db.query(CodingProblem).filter(CodingProblem.id == req.problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    level = max(1, min(4, req.hint_level or 1))
    category = problem.category or "Algorithms"
    title = problem.title

    hints_by_level = {
        1: f"💡 **Conceptual Overview**: For '{title}', consider what data structure allows the fastest lookup or state tracking (e.g. Hash Map, Two Pointers, or Binary Search).",
        2: f"🔍 **Algorithmic Strategy**: If this problem involves searching or paired values, check if sorting or storing elements in a dictionary with `diff = target - num` reduces complexity from O(N²) to O(N).",
        3: f"⚡ **Step-by-Step Implementation**: Iterate through the collection once. At each step, compute your lookup key. If present, return your solution; otherwise, insert the current element and index into your state map.",
        4: f"🎯 **Edge Cases & Complexity**: Be mindful of duplicates, empty inputs, and boundary constraints. The optimal time complexity for this approach is O(N) with O(N) auxiliary space."
    }

    hint_text = hints_by_level.get(level, hints_by_level[1])

    return {
        "problem_id": str(problem.id),
        "hint_level": level,
        "hint": hint_text,
        "next_level": min(4, level + 1),
    }


