"""
Integration test: full recruiter evaluation flow against the database.
"""

import os
import sys
import logging
import pytest
from fastapi.testclient import TestClient

logging.disable(logging.INFO)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.job import Job
from app.middleware.auth_middleware import get_current_recruiter


def test_recruiter_evaluation_flow():
    db = SessionLocal()

    # Find recruiter
    recruiter = db.query(User).filter(User.role == UserRole.RECRUITER).first()
    if not recruiter:
        db.close()
        pytest.skip("no recruiter user in database")

    job = db.query(Job).filter(Job.recruiter_id == recruiter.id).first()
    if not job:
        job = Job(
            title="Evaluation Test Job",
            company="TestCo",
            description="Integration test job for the deterministic ranking engine.",
            required_skills=["Python", "SQL"],
            location="Remote",
            recruiter_id=recruiter.id,
        )
        db.add(job)
        db.commit()
        db.refresh(job)

    app.dependency_overrides[get_current_recruiter] = lambda: recruiter
    client = TestClient(app, raise_server_exceptions=False)

    # 1. GET weights returns percent units
    r = client.get(f"/api/recruiter/jobs/{job.id}/weights")
    assert r.status_code == 200
    w = r.json()
    assert w.get("total_weight", 0) > 1

    # 2. PUT invalid weights (total 95) -> 400
    r = client.put(
        f"/api/recruiter/jobs/{job.id}/weights",
        json={"ats_weight": 0, "coding_weight": 50, "skill_weight": 25, "interview_weight": 20},
    )
    assert r.status_code == 400
    detail = r.json().get("detail", {})
    assert detail.get("error") == "Weights must total exactly 100%"
    assert detail.get("total_weight") == 95

    # 3. PUT valid weights (20/25/30/25) -> 200
    r = client.put(
        f"/api/recruiter/jobs/{job.id}/weights",
        json={"ats_weight": 20, "coding_weight": 25, "skill_weight": 30, "interview_weight": 25},
    )
    assert r.status_code == 200

    # 4. POST recalculate
    r = client.post(f"/api/recruiter/jobs/{job.id}/recalculate")
    assert r.status_code == 200
    summary = r.json()
    assert abs(sum(summary["weights"].values()) - 100) < 0.01

    # 5. Rankings
    rankings = summary.get("rankings", [])
    for ev in rankings:
        if ev["eligibility"] == "READY_FOR_RANKING":
            c = ev["contributions"]
            expected = round(
                sum((c[k]["score"] or 0) * c[k]["weight"] / 100.0 for k in ["ats", "coding", "skill", "interview"]),
                2,
            )
            assert abs(ev["overall_score"] - expected) < 0.05
            assert 0 <= ev["overall_score"] <= 100
            break

    scores = [ev["overall_score"] or 0 for ev in rankings]
    assert scores == sorted(scores, reverse=True)

    # 6. Score breakdown endpoint
    if rankings:
        cid = rankings[0]["candidate_id"]
        r = client.get(f"/api/recruiter/jobs/{job.id}/candidates/{cid}/score-breakdown")
        assert r.status_code == 200
        bd = r.json()
        assert "contributions" in bd

    # 7. Compare endpoint
    if len(rankings) >= 2:
        r = client.post(
            f"/api/recruiter/jobs/{job.id}/compare",
            json={"candidate_ids": [rankings[0]["candidate_id"], rankings[1]["candidate_id"]]},
        )
        assert r.status_code == 200

    # 8. Rankings GET endpoint (frontend path)
    r = client.get(f"/api/recruiter/jobs/{job.id}/rankings")
    assert r.status_code == 200
    rd = r.json()
    assert "ranked_candidates" in rd and "pending_candidates" in rd

    db.close()


if __name__ == "__main__":
    pytest.main([__file__])