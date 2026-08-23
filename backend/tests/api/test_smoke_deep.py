"""Deep smoke test: all GET endpoints + authed recruiter/candidate flows."""
import os
import sys
import logging
import pytest
from fastapi.testclient import TestClient

logging.disable(logging.INFO)
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.job import Job
from app.middleware.auth_middleware import get_current_recruiter, get_current_user


def test_api_endpoints_smoke():
    db = SessionLocal()
    recruiter = db.query(User).filter(User.role == UserRole.RECRUITER).first()
    candidate = db.query(User).filter(User.role == UserRole.CANDIDATE).first()

    if recruiter:
        app.dependency_overrides[get_current_recruiter] = lambda: recruiter
    if candidate:
        app.dependency_overrides[get_current_user] = lambda: candidate

    client = TestClient(app, raise_server_exceptions=False)

    # 1. PUBLIC
    assert client.get("/health").status_code == 200
    assert client.get("/api/trends").status_code == 200
    assert client.get("/api/jobs/search").status_code == 200

    # 2. CANDIDATE
    if candidate:
        assert client.get("/api/resumes/").status_code == 200
        assert client.get("/api/candidate/profile").status_code == 200
        assert client.get("/api/applications/").status_code == 200
        assert client.get("/api/coding/problems").status_code == 200
        assert client.get("/api/coding/profile").status_code == 200
        assert client.get("/api/notifications").status_code == 200

    # 3. RECRUITER
    if recruiter:
        jobs = db.query(Job).filter(Job.recruiter_id == recruiter.id).all()
        for j in jobs[:2]:
            assert client.get(f"/api/recruiter/jobs/{j.id}/rankings").status_code == 200
            assert client.get(f"/api/recruiter/jobs/{j.id}/weights").status_code == 200
            assert client.get(f"/api/recruiter/jobs/{j.id}/analytics").status_code == 200

        assert client.get("/api/recruiter/jobs").status_code == 200
        assert client.get("/api/recruiter/interviews").status_code == 200

    db.close()


if __name__ == "__main__":
    pytest.main([__file__])