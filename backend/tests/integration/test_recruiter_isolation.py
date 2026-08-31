"""
Integration Test Suite: Complete Recruiter Data Isolation & Aptitude Builder Validation.
Ensures zero data leakage across recruiters, IDOR prevention, candidate public discovery preservation,
and robust Aptitude Assessment builder CRUD operations.
"""

import os
import sys
import uuid
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.job import Job, JobStatus, JobType
from app.models.application import Application, ApplicationStatus
from app.models.interview import Interview, InterviewStatus
from app.models.aptitude import AptitudeAssessment, AssessmentLaunchCode
from app.middleware.auth_middleware import get_current_recruiter, get_current_user, get_current_candidate
from app.utils.jwt_handler import hash_password


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()


@pytest.fixture(scope="module")
def isolation_setup(db_session):
    db = db_session
    suffix = uuid.uuid4().hex[:6]

    # Create Recruiter A
    rec_a = User(
        email=f"recruiter_a_{suffix}@testisolation.com",
        hashed_password=hash_password("Password123!"),
        full_name="Recruiter Alpha",
        role=UserRole.RECRUITER,
        is_active=True
    )
    # Create Recruiter B
    rec_b = User(
        email=f"recruiter_b_{suffix}@testisolation.com",
        hashed_password=hash_password("Password123!"),
        full_name="Recruiter Beta",
        role=UserRole.RECRUITER,
        is_active=True
    )
    # Create Fresh Recruiter C (zero jobs posted)
    rec_c = User(
        email=f"recruiter_c_fresh_{suffix}@testisolation.com",
        hashed_password=hash_password("Password123!"),
        full_name="Recruiter Charlie Fresh",
        role=UserRole.RECRUITER,
        is_active=True
    )
    # Create Candidate
    cand = User(
        email=f"candidate_{suffix}@testisolation.com",
        hashed_password=hash_password("Password123!"),
        full_name="Candidate Persona",
        role=UserRole.CANDIDATE,
        is_active=True
    )
    db.add_all([rec_a, rec_b, rec_c, cand])
    db.commit()
    db.refresh(rec_a)
    db.refresh(rec_b)
    db.refresh(rec_c)
    db.refresh(cand)

    # Recruiter A creates Job A
    job_a = Job(
        recruiter_id=rec_a.id,
        title=f"Backend Lead {suffix}",
        company="Alpha Corp",
        description="Senior Python developer with FastAPI and PostgreSQL expertise.",
        location="Bengaluru",
        required_skills=["Python", "FastAPI", "PostgreSQL"],
        job_type=JobType.FULL_TIME,
        status=JobStatus.ACTIVE
    )
    # Recruiter B creates Job B
    job_b = Job(
        recruiter_id=rec_b.id,
        title=f"Frontend Lead {suffix}",
        company="Beta Innovations",
        description="Lead React developer with TypeScript and TailwindCSS expertise.",
        location="Remote",
        required_skills=["React", "TypeScript", "TailwindCSS"],
        job_type=JobType.FULL_TIME,
        status=JobStatus.ACTIVE
    )
    db.add_all([job_a, job_b])
    db.commit()
    db.refresh(job_a)
    db.refresh(job_b)

    # Candidate applies to Job A only
    app_a = Application(
        candidate_id=cand.id,
        job_id=job_a.id,
        status=ApplicationStatus.APPLIED,
        ats_score=88.5,
        applied_at=datetime.utcnow()
    )
    db.add(app_a)
    db.commit()
    db.refresh(app_a)

    yield {
        "rec_a": rec_a,
        "rec_b": rec_b,
        "rec_c": rec_c,
        "cand": cand,
        "job_a": job_a,
        "job_b": job_b,
        "app_a": app_a,
    }

    # Clean up test records
    try:
        db.query(AssessmentLaunchCode).filter(AssessmentLaunchCode.job_id.in_([job_a.id, job_b.id])).delete(synchronize_session=False)
        db.query(AptitudeAssessment).filter(AptitudeAssessment.job_id.in_([job_a.id, job_b.id])).delete(synchronize_session=False)
        db.query(Interview).filter(Interview.job_id.in_([job_a.id, job_b.id])).delete(synchronize_session=False)
        db.query(Application).filter(Application.job_id.in_([job_a.id, job_b.id])).delete(synchronize_session=False)
        db.query(Job).filter(Job.id.in_([job_a.id, job_b.id])).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_([rec_a.id, rec_b.id, rec_c.id, cand.id])).delete(synchronize_session=False)
        db.commit()
    except Exception:
        db.rollback()


def test_recruiter_job_isolation(isolation_setup):
    """Ensure recruiters see only their own jobs and never another recruiter's jobs."""
    rec_a = isolation_setup["rec_a"]
    rec_b = isolation_setup["rec_b"]
    rec_c = isolation_setup["rec_c"]
    job_a = isolation_setup["job_a"]
    job_b = isolation_setup["job_b"]

    client = TestClient(app, raise_server_exceptions=False)

    # 1. Recruiter A request
    app.dependency_overrides[get_current_recruiter] = lambda: rec_a
    app.dependency_overrides[get_current_user] = lambda: rec_a
    res_a = client.get("/api/recruiter/jobs")
    assert res_a.status_code == 200
    jobs_a = res_a.json()
    job_a_ids = [j["id"] for j in jobs_a]
    assert str(job_a.id) in job_a_ids
    assert str(job_b.id) not in job_a_ids

    # 2. Recruiter B request
    app.dependency_overrides[get_current_recruiter] = lambda: rec_b
    app.dependency_overrides[get_current_user] = lambda: rec_b
    res_b = client.get("/api/recruiter/jobs")
    assert res_b.status_code == 200
    jobs_b = res_b.json()
    job_b_ids = [j["id"] for j in jobs_b]
    assert str(job_b.id) in job_b_ids
    assert str(job_a.id) not in job_b_ids

    # 3. Fresh Recruiter C (0 jobs posted) - MUST RETURN EMPTY LIST, NEVER FALLBACK
    app.dependency_overrides[get_current_recruiter] = lambda: rec_c
    app.dependency_overrides[get_current_user] = lambda: rec_c
    res_c = client.get("/api/recruiter/jobs")
    assert res_c.status_code == 200
    jobs_c = res_c.json()
    assert len(jobs_c) == 0, f"Fresh recruiter received leaked jobs: {jobs_c}"


def test_fresh_recruiter_dashboard_and_candidates_zero_leak(isolation_setup):
    """Ensure newly registered recruiter sees 0 candidates and 0 dashboard analytics."""
    rec_c = isolation_setup["rec_c"]

    client = TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides[get_current_recruiter] = lambda: rec_c
    app.dependency_overrides[get_current_user] = lambda: rec_c

    # Candidates list must be empty
    res_cands = client.get("/api/recruiter/candidates")
    assert res_cands.status_code == 200
    assert res_cands.json() == []

    # Dashboard analytics must be 0
    res_dash = client.get("/api/recruiter/dashboard")
    assert res_dash.status_code == 200
    data = res_dash.json()
    assert data["summary"]["active_jobs"] == 0
    assert data["summary"]["total_applications"] == 0
    assert data["summary"]["shortlisted"] == 0
    assert data["summary"]["interviews"] == 0
    assert data["jobs"] == []


def test_cross_recruiter_idor_attacks_rejected(isolation_setup):
    """Ensure IDOR attacks where Recruiter B attempts to access/modify Recruiter A's jobs are rejected."""
    rec_b = isolation_setup["rec_b"]
    job_a = isolation_setup["job_a"]

    client = TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides[get_current_recruiter] = lambda: rec_b
    app.dependency_overrides[get_current_user] = lambda: rec_b

    # Recruiter B tries to get rankings for Job A
    res_rankings = client.get(f"/api/recruiter/jobs/{job_a.id}/rankings")
    assert res_rankings.status_code == 404

    # Recruiter B tries to get weights for Job A
    res_weights = client.get(f"/api/recruiter/jobs/{job_a.id}/weights")
    assert res_weights.status_code == 404

    # Recruiter B tries to get analytics for Job A
    res_analytics = client.get(f"/api/recruiter/jobs/{job_a.id}/analytics")
    assert res_analytics.status_code == 404

    # Recruiter B tries to delete Job A
    res_del = client.delete(f"/api/recruiter/jobs/{job_a.id}")
    assert res_del.status_code == 404


def test_candidate_public_search_and_applications_isolated(isolation_setup):
    """Ensure candidate can discover all active jobs, while recruiters see only applicants for their own jobs."""
    rec_a = isolation_setup["rec_a"]
    rec_b = isolation_setup["rec_b"]
    cand = isolation_setup["cand"]
    job_a = isolation_setup["job_a"]
    job_b = isolation_setup["job_b"]

    client = TestClient(app, raise_server_exceptions=False)

    # Public job search
    app.dependency_overrides.clear()
    res_search = client.get("/api/jobs/search")
    assert res_search.status_code == 200
    search_titles = [j.get("title") for j in res_search.json().get("jobs", [])]
    assert job_a.title in search_titles
    assert job_b.title in search_titles

    # Recruiter A sees candidate in applicant pool
    app.dependency_overrides[get_current_recruiter] = lambda: rec_a
    app.dependency_overrides[get_current_user] = lambda: rec_a
    res_cands_a = client.get("/api/recruiter/candidates")
    assert res_cands_a.status_code == 200
    cands_a = res_cands_a.json()
    assert len(cands_a) >= 1
    assert any(c["candidate_id"] == str(cand.id) for c in cands_a)

    # Recruiter B does NOT see candidate (candidate only applied to Job A)
    app.dependency_overrides[get_current_recruiter] = lambda: rec_b
    app.dependency_overrides[get_current_user] = lambda: rec_b
    res_cands_b = client.get("/api/recruiter/candidates")
    assert res_cands_b.status_code == 200
    cands_b = res_cands_b.json()
    assert not any(c["candidate_id"] == str(cand.id) for c in cands_b)


def test_aptitude_builder_full_lifecycle_and_isolation(isolation_setup):
    """Test Aptitude Assessment creation, publish, launch code, list, delete, and isolation."""
    rec_a = isolation_setup["rec_a"]
    rec_b = isolation_setup["rec_b"]
    job_a = isolation_setup["job_a"]

    client = TestClient(app, raise_server_exceptions=False)

    # 1. Recruiter A creates an aptitude assessment for Job A
    app.dependency_overrides[get_current_recruiter] = lambda: rec_a
    app.dependency_overrides[get_current_user] = lambda: rec_a

    create_payload = {
        "title": "Backend Engineering Screening Test",
        "password": "SecurePassword123!",
        "duration_minutes": 30,
        "total_marks": 60.0,
        "passing_score": 60.0,
        "negative_marking": 0.5,
        "max_attempts": 1,
        "shuffle_questions": True,
        "shuffle_options": True,
        "questions": [
            {
                "question_text": "What is the time complexity of dictionary lookup in Python on average?",
                "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
                "correct_answer": "0",
                "marks": 2.0,
                "negative_marks": 0.5,
                "category": "Technical",
                "difficulty": "Easy"
            },
            {
                "question_text": "Which HTTP method is idempotent according to RFC specifications?",
                "options": ["POST", "PUT", "CONNECT", "PATCH"],
                "correct_answer": "1",
                "marks": 2.0,
                "negative_marks": 0.5,
                "category": "Technical",
                "difficulty": "Medium"
            }
        ]
    }

    res_create = client.post(f"/api/recruiter/jobs/{job_a.id}/aptitude-assessments", json=create_payload)
    assert res_create.status_code == 201
    assessment_id = res_create.json()["assessment_id"]

    # 2. Recruiter A lists assessments
    res_list_a = client.get("/api/recruiter/aptitude-assessments")
    assert res_list_a.status_code == 200
    assert any(a["id"] == assessment_id for a in res_list_a.json())

    # 3. Recruiter B lists assessments - MUST NOT SEE Recruiter A's assessment
    app.dependency_overrides[get_current_recruiter] = lambda: rec_b
    app.dependency_overrides[get_current_user] = lambda: rec_b
    res_list_b = client.get("/api/recruiter/aptitude-assessments")
    assert res_list_b.status_code == 200
    assert not any(a["id"] == assessment_id for a in res_list_b.json())

    # 4. Recruiter B tries to delete Recruiter A's assessment -> 404
    res_del_b = client.delete(f"/api/recruiter/aptitude-assessments/{assessment_id}")
    assert res_del_b.status_code == 404

    # 5. Recruiter A publishes the assessment and receives launch code
    app.dependency_overrides[get_current_recruiter] = lambda: rec_a
    app.dependency_overrides[get_current_user] = lambda: rec_a
    res_publish = client.post(
        f"/api/recruiter/aptitude-assessments/{assessment_id}/publish",
        json={"password": "SecurePassword123!"}
    )
    assert res_publish.status_code == 200
    assert "launch_code" in res_publish.json()
    assert len(res_publish.json()["launch_code"]) == 6

    # 6. Recruiter A deletes the assessment cleanly
    res_del_a = client.delete(
        f"/api/recruiter/aptitude-assessments/{assessment_id}",
        params={"password": "SecurePassword123!"}
    )
    assert res_del_a.status_code == 200
