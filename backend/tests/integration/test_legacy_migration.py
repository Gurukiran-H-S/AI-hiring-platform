"""Verify legacy weight migration + real-job evaluation + coding.py caller."""
import os
import sys
import logging
import pytest

logging.disable(logging.INFO)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.job import Job
from app.models.user import User, UserRole
from app.models.application import Application
from app.services import evaluation_engine
from app.services.candidate_scoring_service import candidate_scoring_service


def test_legacy_job_weights_and_evaluation():
    db = SessionLocal()
    job = db.query(Job).first()
    if job:
        w = evaluation_engine.get_job_weights_percent(db, job.id)
        assert w["total_weight"] == 100.0 and w["is_valid"] is True

        apps = db.query(Application).filter(Application.job_id == job.id).all()
        for a in apps[:3]:
            ev = evaluation_engine.evaluate_application(db, a, job, w)
            assert 0 <= ev["overall_score"] <= 100

    cand = db.query(User).filter(User.role == UserRole.CANDIDATE).first()
    if cand and job:
        res = candidate_scoring_service.evaluate_candidate_for_job(db, cand.id, job.id)
        assert res["overall_score"] is None or 0 <= res["overall_score"] <= 100

    db.close()


if __name__ == "__main__":
    pytest.main([__file__])