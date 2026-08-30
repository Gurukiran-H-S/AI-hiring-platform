"""
Tests for Secure Job-Specific Aptitude Assessment Builder + Exam Launch System:
- Question Bank retrieval & validation
- Recruiter assessment creation with password hashing & question snapshots
- Recruiter password verification & editing protection
- 6-Digit Launch Code generation & 5-minute pre-exam window
- Candidate eligibility enforcement (Application-based isolation)
- Server-side exam timer, anti-cheat question sanitization, and anti-refresh
- Real-time auto-saving & server evaluation with negative marking formula
- Recruiter candidate rankings & section-wise analytics
"""

import os
import sys
import uuid
from datetime import datetime, timedelta
import pytest

backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import Base, engine, SessionLocal
from app.models.user import User, UserRole
from app.models.job import Job, JobStatus
from app.models.application import Application, ApplicationStatus
from app.models.aptitude import (
    AptitudeAssessment, AssessmentQuestion, AssessmentLaunchCode,
    AssessmentAttempt, AssessmentAnswer
)
from app.services import aptitude_evaluation_service as service


@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture(scope="module")
def test_setup_data(db_session):
    # 1. Create Recruiter A & B
    recruiter_a = User(
        email=f"recruiter_a_{uuid.uuid4().hex[:6]}@example.com",
        hashed_password="testhash",
        full_name="Recruiter Alpha",
        role=UserRole.RECRUITER
    )
    recruiter_b = User(
        email=f"recruiter_b_{uuid.uuid4().hex[:6]}@example.com",
        hashed_password="testhash",
        full_name="Recruiter Beta",
        role=UserRole.RECRUITER
    )
    # 2. Create Candidate 1 & 2
    candidate_1 = User(
        email=f"cand1_{uuid.uuid4().hex[:6]}@example.com",
        hashed_password="testhash",
        full_name="Candidate John",
        role=UserRole.CANDIDATE
    )
    candidate_2 = User(
        email=f"cand2_{uuid.uuid4().hex[:6]}@example.com",
        hashed_password="testhash",
        full_name="Candidate Jane",
        role=UserRole.CANDIDATE
    )
    db_session.add_all([recruiter_a, recruiter_b, candidate_1, candidate_2])
    db_session.flush()


    # 3. Create Job A (Python Developer) & Job B (Java Developer)
    job_a = Job(
        recruiter_id=recruiter_a.id,
        title="Python Backend Developer",
        company="Tech Innovations",
        description="FastAPI, Python, SQL backend role.",
        status=JobStatus.ACTIVE
    )
    job_b = Job(
        recruiter_id=recruiter_b.id,
        title="Java Spring Developer",
        company="Enterprise Corp",
        description="Java Spring Boot microservices.",
        status=JobStatus.ACTIVE
    )
    db_session.add_all([job_a, job_b])
    db_session.flush()

    # 4. Candidate 1 applies to Job A only; Candidate 2 applies to Job B only
    app_1 = Application(
        candidate_id=candidate_1.id,
        job_id=job_a.id,
        status=ApplicationStatus.APPLIED
    )
    app_2 = Application(
        candidate_id=candidate_2.id,
        job_id=job_b.id,
        status=ApplicationStatus.APPLIED
    )
    db_session.add_all([app_1, app_2])
    db_session.commit()

    return {
        "recruiter_a": recruiter_a,
        "recruiter_b": recruiter_b,
        "candidate_1": candidate_1,
        "candidate_2": candidate_2,
        "job_a": job_a,
        "job_b": job_b,
        "app_1": app_1,
        "app_2": app_2
    }


def test_question_bank_retrieval():
    """Verify standard question bank contains categorized questions with explanations."""
    bank = service.QUESTION_BANK
    assert len(bank) >= 10
    categories = {q["category"] for q in bank}
    assert "Numerical Ability" in categories
    assert "Verbal Ability" in categories
    assert "Reasoning Ability" in categories
    assert "Technical" in categories
    for q in bank:
        assert len(q["options"]) == 4
        assert q["correct_answer"] in ["0", "1", "2", "3"]
        assert q["marks"] > 0


def test_assessment_creation_and_password_security(db_session, test_setup_data):
    """Verify recruiter assessment creation hashes the password and saves question snapshots."""
    recruiter = test_setup_data["recruiter_a"]
    job = test_setup_data["job_a"]

    # Short password rejection
    with pytest.raises(ValueError, match="at least 6 characters"):
        service.create_aptitude_assessment(
            db=db_session,
            recruiter_id=recruiter.id,
            job_id=job.id,
            title="Short Pass Test",
            password="123"
        )

    # Valid creation
    assessment = service.create_aptitude_assessment(
        db=db_session,
        recruiter_id=recruiter.id,
        job_id=job.id,
        title="Python Developer Aptitude Assessment",
        password="SecurePass99!",
        duration_minutes=30,
        total_marks=80.0,
        passing_score=60.0,
        negative_marking=0.5,
        description="Comprehensive technical and logical reasoning test.",
        instructions="Complete within 30 minutes. Negative marking applies."
    )

    assert assessment.id is not None
    assert assessment.status == "DRAFT"
    assert assessment.password_hash != "SecurePass99!"  # Never plaintext!
    assert len(assessment.questions) > 0

    # Password Verification
    assert service.verify_assessment_password(assessment, "SecurePass99!") is True
    assert service.verify_assessment_password(assessment, "WrongPassword") is False


def test_launch_code_generation_and_publishing(db_session, test_setup_data):
    """Verify 6-digit Launch Code generation and publishing workflow."""
    recruiter = test_setup_data["recruiter_a"]
    job = test_setup_data["job_a"]

    assessment = db_session.query(AptitudeAssessment).filter(AptitudeAssessment.job_id == job.id).first()
    assessment.status = "PUBLISHED"
    db_session.commit()

    launch_code_obj = service.generate_launch_code(db_session, assessment)
    assert len(launch_code_obj.code) == 6
    assert launch_code_obj.code.isdigit()
    assert launch_code_obj.status == "ACTIVE"
    assert launch_code_obj.expires_at > datetime.utcnow()


def test_candidate_eligibility_isolation(db_session, test_setup_data):
    """
    Test Case 91 & 92: Candidate A applied to Job A is eligible.
    Candidate B applied to Job B is NOT eligible for Job A's assessment.
    """
    job_a = test_setup_data["job_a"]
    cand_1 = test_setup_data["candidate_1"]  # Applied to Job A
    cand_2 = test_setup_data["candidate_2"]  # Applied to Job B

    assessment = db_session.query(AptitudeAssessment).filter(AptitudeAssessment.job_id == job_a.id).first()

    # Candidate 1 (Applied) -> Eligible
    eligibility_1 = service.check_candidate_eligibility(db_session, assessment.id, cand_1.id)
    assert eligibility_1["eligible"] is True
    assert eligibility_1["job_id"] == str(job_a.id)

    # Candidate 2 (Not applied to Job A) -> DENIED
    eligibility_2 = service.check_candidate_eligibility(db_session, assessment.id, cand_2.id)
    assert eligibility_2["eligible"] is False
    assert "must apply for this job posting" in eligibility_2["reason"]


def test_exam_start_with_launch_code(db_session, test_setup_data):
    """
    Test Case 94 & 26: Invalid launch code is rejected; valid code creates timed attempt.
    """
    job_a = test_setup_data["job_a"]
    cand_1 = test_setup_data["candidate_1"]
    assessment = db_session.query(AptitudeAssessment).filter(AptitudeAssessment.job_id == job_a.id).first()
    launch_code = db_session.query(AssessmentLaunchCode).filter(AssessmentLaunchCode.assessment_id == assessment.id).first().code

    # 1. Invalid Launch Code -> DENIED
    with pytest.raises(ValueError, match="Invalid or expired Launch Code"):
        service.start_candidate_exam_attempt(
            db=db_session,
            assessment_id=assessment.id,
            candidate_id=cand_1.id,
            launch_code="000000"
        )

    # 2. Valid Launch Code -> Attempt Created
    attempt_state = service.start_candidate_exam_attempt(
        db=db_session,
        assessment_id=assessment.id,
        candidate_id=cand_1.id,
        launch_code=launch_code
    )

    assert attempt_state["attempt_id"] is not None
    assert attempt_state["status"] == "IN_PROGRESS"
    assert attempt_state["remaining_seconds"] > 0
    assert len(attempt_state["questions"]) > 0

    # Verify Correct Answer is NOT leaked to candidate
    for q in attempt_state["questions"]:
        assert "correct_answer" not in q
        assert "explanation" not in q


def test_auto_save_and_scoring_with_negative_marking(db_session, test_setup_data):
    """
    Test Case 98: Auto-save candidate answers and verify server-side score calculation:
    Score = sum(correct * marks) - sum(wrong * negative_marks), clamped >= 0.
    """
    cand_1 = test_setup_data["candidate_1"]
    attempt = db_session.query(AssessmentAttempt).filter(AssessmentAttempt.candidate_id == cand_1.id).first()
    assessment = attempt.assessment
    questions = assessment.questions

    # Question 0: Correct
    q0 = questions[0]
    service.save_candidate_answer(
        db=db_session,
        attempt_id=attempt.id,
        candidate_id=cand_1.id,
        question_id=q0.id,
        selected_answer=q0.correct_answer
    )

    # Question 1: Wrong
    q1 = questions[1]
    wrong_ans = "0" if q1.correct_answer != "0" else "1"
    service.save_candidate_answer(
        db=db_session,
        attempt_id=attempt.id,
        candidate_id=cand_1.id,
        question_id=q1.id,
        selected_answer=wrong_ans
    )

    # Question 2..N: Leave unanswered

    # Submit and verify
    result = service.submit_candidate_attempt(
        db=db_session,
        attempt_id=attempt.id,
        candidate_id=cand_1.id,
        is_auto=False
    )

    assert result["status"] == "SUBMITTED"
    assert result["correct_count"] == 1
    assert result["wrong_count"] == 1
    assert result["unanswered_count"] == len(questions) - 2

    expected_score = max(0.0, (1 * q0.marks) - (1 * q1.negative_marks))  # 2.0 - 0.5 = 1.5
    assert result["score"] == expected_score
    assert result["accuracy"] == 50.0  # 1 correct out of 2 attempted
    assert "section_breakdown" in result
    assert result["time_taken_seconds"] >= 0


def test_idempotent_duplicate_submission_protection(db_session, test_setup_data):
    """Test Case 101: Duplicate submissions return same calculated result without altering scores."""
    cand_1 = test_setup_data["candidate_1"]
    attempt = db_session.query(AssessmentAttempt).filter(AssessmentAttempt.candidate_id == cand_1.id).first()

    first_res = service.get_attempt_result_report(db_session, attempt.id, cand_1.id)
    second_res = service.submit_candidate_attempt(db_session, attempt.id, cand_1.id, is_auto=False)

    assert first_res["score"] == second_res["score"]
    assert first_res["percentage"] == second_res["percentage"]


def test_recruiter_analytics_and_candidate_rankings(db_session, test_setup_data):
    """Test Case 44 & 45: Recruiter dashboard analytics and ranked candidate table."""
    recruiter = test_setup_data["recruiter_a"]
    assessment = db_session.query(AptitudeAssessment).filter(AptitudeAssessment.recruiter_id == recruiter.id).first()

    analytics = service.get_recruiter_assessment_analytics(db_session, assessment.id, recruiter.id)
    assert analytics["summary"]["completed"] == 1
    assert analytics["summary"]["total_applicants"] >= 1
    assert len(analytics["candidate_rankings"]) == 1
    assert analytics["candidate_rankings"][0]["candidate_name"] == "Candidate John"
    assert analytics["active_launch_code"] is not None


if __name__ == "__main__":
    pytest.main([__file__])
