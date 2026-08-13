import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.evaluation import EvaluationWeight, CandidateScore, CandidateSkillEvaluation
from app.models.application import Application
from app.models.resume import Resume
from app.models.coding import CandidateCodingStats, CandidateSubmission, SubmissionStatus, RecruiterAssessmentAttempt
from app.models.job import Job

logger = logging.getLogger(__name__)

class CandidateScoringService:
    """Multi-Dimensional Candidate Scoring & Weight Calculation Engine."""

    def get_job_weights(self, db: Session, job_id: Any) -> Dict[str, float]:
        """Fetch custom job evaluation weights or return default weights."""
        weight_obj = db.query(EvaluationWeight).filter(EvaluationWeight.job_id == job_id).first()
        if weight_obj:
            return {
                "ats_weight": weight_obj.ats_weight,
                "coding_weight": weight_obj.coding_weight,
                "skill_weight": weight_obj.skill_weight,
                "interview_weight": weight_obj.interview_weight,
            }
        return {
            "ats_weight": 0.30,
            "coding_weight": 0.40,
            "skill_weight": 0.20,
            "interview_weight": 0.10,
        }

    def calculate_overall_score(
        self,
        ats_score: float,
        coding_score: float,
        skill_score: float,
        interview_score: float,
        weights: Dict[str, float]
    ) -> float:
        """Calculate weighted overall candidate score, normalized by weights sum."""
        w_ats = weights.get("ats_weight", 0.30)
        w_code = weights.get("coding_weight", 0.40)
        w_skill = weights.get("skill_weight", 0.20)
        w_int = weights.get("interview_weight", 0.10)

        weight_sum = w_ats + w_code + w_skill + w_int
        if weight_sum <= 0:
            weight_sum = 1.0

        overall = (
            (ats_score * w_ats) +
            (coding_score * w_code) +
            (skill_score * w_skill) +
            (interview_score * w_int)
        )
        return round(overall / weight_sum, 1)

    def evaluate_candidate_for_job(self, db: Session, candidate_id: Any, job_id: Any) -> Dict[str, Any]:
        """Compute full 360-degree evaluation for a candidate against a job."""
        job = db.query(Job).filter(Job.id == job_id).first()
        weights = self.get_job_weights(db, job_id)

        # 1. ATS Score
        app = db.query(Application).filter(
            Application.candidate_id == candidate_id,
            Application.job_id == job_id
        ).first()

        res = app.resume if (app and app.resume) else db.query(Resume).filter(Resume.user_id == candidate_id).order_by(Resume.created_at.desc()).first()
        ats_score = res.ats_score if res else 75.0

        # 2. Coding Score (Assessment attempt vs general stats)
        coding_score = 80.0
        if job and job.assessment_id:
            attempt = db.query(RecruiterAssessmentAttempt).filter(
                RecruiterAssessmentAttempt.assessment_id == job.assessment_id,
                RecruiterAssessmentAttempt.candidate_id == candidate_id,
                RecruiterAssessmentAttempt.status == "submitted"
            ).first()
            if attempt:
                coding_score = attempt.score
            else:
                coding_score = 0.0  # assessment exists but not submitted yet
        else:
            coding_stats = db.query(CandidateCodingStats).filter(CandidateCodingStats.candidate_id == candidate_id).first()
            if coding_stats and coding_stats.total_score > 0:
                coding_score = min(100.0, round((coding_stats.total_score / 500.0) * 100.0, 1))
                if coding_score < 40.0:
                    coding_score = 65.0

        # 3. Skill Match Score (Job required skills vs candidate skills)
        job_skills = [s.lower().strip() for s in (job.required_skills if job else ["python", "sql"])]
        cand_skills = [s.lower().strip() for s in (res.parsed_skills if (res and res.parsed_skills) else ["python", "sql"])]
        
        matched_skills = [s for s in job_skills if s in cand_skills]
        missing_skills = [s for s in job_skills if s not in cand_skills]
        skill_score = round((len(matched_skills) / max(1, len(job_skills))) * 100.0, 1)

        # 4. Interview Score
        interview_score = 85.0

        # Overall Score Calculation
        overall_score = self.calculate_overall_score(ats_score, coding_score, skill_score, interview_score, weights)

        # Match level & warnings
        match_level = "Strong Match" if overall_score >= 85.0 else ("Potential Match" if overall_score >= 70.0 else ("Needs Review" if overall_score >= 60.0 else "Low Match"))
        
        mismatch_warning = None
        if ats_score >= 80.0 and coding_score < 65.0:
            mismatch_warning = "Resume-to-assessment mismatch detected. Further technical verification recommended."
        elif ats_score < 60.0 and coding_score >= 85.0:
            mismatch_warning = "Strong technical performance despite lower resume-job similarity. Manual review recommended."

        # Save/Update CandidateScore record in DB
        score_record = db.query(CandidateScore).filter(
            CandidateScore.candidate_id == candidate_id,
            CandidateScore.job_id == job_id
        ).first()

        if not score_record:
            score_record = CandidateScore(
                candidate_id=candidate_id,
                job_id=job_id,
                ats_score=ats_score,
                coding_score=coding_score,
                skill_match_score=skill_score,
                interview_score=interview_score,
                overall_score=overall_score,
                ats_weight=weights["ats_weight"],
                coding_weight=weights["coding_weight"],
                skill_weight=weights["skill_weight"],
                interview_weight=weights["interview_weight"],
                match_level=match_level,
                mismatch_warning=mismatch_warning
            )
            db.add(score_record)
        else:
            score_record.ats_score = ats_score
            score_record.coding_score = coding_score
            score_record.skill_match_score = skill_score
            score_record.interview_score = interview_score
            score_record.overall_score = overall_score
            score_record.ats_weight = weights["ats_weight"]
            score_record.coding_weight = weights["coding_weight"]
            score_record.skill_weight = weights["skill_weight"]
            score_record.interview_weight = weights["interview_weight"]
            score_record.match_level = match_level
            score_record.mismatch_warning = mismatch_warning

        db.commit()

        return {
            "candidate_id": str(candidate_id),
            "job_id": str(job_id),
            "ats_score": round(ats_score, 1),
            "coding_score": round(coding_score, 1),
            "skill_match_score": round(skill_score, 1),
            "interview_score": round(interview_score, 1),
            "overall_score": overall_score,
            "weights": weights,
            "match_level": match_level,
            "mismatch_warning": mismatch_warning,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
        }

candidate_scoring_service = CandidateScoringService()
