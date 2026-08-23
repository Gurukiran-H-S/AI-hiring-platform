"""
Compatibility layer - delegates to the deterministic evaluation_engine.
Kept so existing callers (coding router) produce identical, spec-compliant
scores: no fabricated defaults, no normalization by weight totals.
"""

import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.evaluation import CandidateScore
from app.services import evaluation_engine

logger = logging.getLogger(__name__)


class CandidateScoringService:

    def get_job_weights(self, db: Session, job_id: Any) -> Dict[str, float]:
        """Legacy shape: decimal fractions. New code should use
        evaluation_engine.get_job_weights_percent()."""
        w = evaluation_engine.get_job_weights_percent(db, job_id)
        return {
            "ats_weight": w["ats_weight"] / 100.0,
            "coding_weight": w["coding_weight"] / 100.0,
            "skill_weight": w["skill_weight"] / 100.0,
            "interview_weight": w["interview_weight"] / 100.0,
        }

    def calculate_overall_score(
        self,
        ats_score: float,
        coding_score: float,
        skill_score: float,
        interview_score: float,
        weights: Dict[str, float],
    ) -> float:
        """Weighted sum with weights as decimals (must total 1.0).
        NO normalization by weight totals - ever."""
        components = {
            "ats_score": ats_score,
            "coding_score": coding_score,
            "skill_match_score": skill_score,
            "interview_score": interview_score,
        }
        pct = {k: round(v * 100.0, 2) for k, v in weights.items()}
        return evaluation_engine.calculate_overall(components, pct)["overall_score"]

    def evaluate_candidate_for_job(
        self, db: Session, candidate_id: Any, job_id: Any
    ) -> Dict[str, Any]:
        """Full evaluation via the deterministic engine (flattened legacy shape)."""
        from app.models.job import Job

        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return {
                "candidate_id": str(candidate_id), "job_id": str(job_id),
                "ats_score": None, "coding_score": None, "skill_match_score": None,
                "interview_score": None, "overall_score": None,
                "weights": {}, "match_level": None, "mismatch_warning": None,
                "matched_skills": [], "missing_skills": [],
            }

        app = (
            db.query(Application)
            .filter(Application.candidate_id == candidate_id, Application.job_id == job_id)
            .first()
        )
        ev = evaluation_engine.evaluate_application(
            db, app, job
        ) if app else evaluation_engine.evaluate_application(
            db, _synthetic_application(candidate_id, job_id), job
        )

        return {
            "candidate_id": str(candidate_id),
            "job_id": str(job_id),
            "ats_score": ev["ats"]["score"],
            "coding_score": ev["coding"]["score"],
            "skill_match_score": ev["skill"]["score"],
            "interview_score": ev["interview"]["score"],
            "overall_score": ev["overall_score"],
            "weights": self.get_job_weights(db, job_id),
            "match_level": ev["match_level"],
            "mismatch_warning": None,
            "matched_skills": ev["skill"]["matched"],
            "missing_skills": ev["skill"]["missing"],
            "eligibility": ev["eligibility"],
            "is_partial": ev["is_partial"],
        }


def _synthetic_application(candidate_id, job_id):
    """Lightweight stand-in so engine component fetchers work when the
    candidate has no Application row yet (never persisted)."""
    class _App:
        pass
    a = _App()
    a.id = None
    a.candidate_id = candidate_id
    a.job_id = job_id
    a.resume = None
    a.ats_score = None
    return a


candidate_scoring_service = CandidateScoringService()