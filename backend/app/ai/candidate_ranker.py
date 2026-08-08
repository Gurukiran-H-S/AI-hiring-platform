"""
Candidate Ranking Engine
Ranks candidates for a specific job using weighted multi-criteria scoring.
Implements Explainable AI to show why each candidate received their score.
"""

import logging
from typing import Dict, List, Any, Optional
from uuid import UUID

logger = logging.getLogger(__name__)


class CandidateRanker:
    """
    Multi-criteria weighted ranking engine for candidates.

    Scoring Weights:
    - ATS Score: 25%
    - Semantic Match: 35%
    - Skills Match: 25%
    - Experience Match: 15%
    """

    WEIGHTS = {
        "ats_score": 0.25,
        "semantic_match": 0.35,
        "skills_match": 0.25,
        "experience_match": 0.15,
    }

    def rank_candidates(
        self,
        candidates: List[Dict[str, Any]],
        job: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """
        Rank a list of candidates for a given job.
        Each candidate dict should have: resume data + application data.
        Returns ranked list with scores and explanations.
        """
        scored = []

        for candidate in candidates:
            score_data = self._compute_candidate_score(candidate, job)
            scored.append({
                **candidate,
                **score_data,
            })

        # Sort by overall score descending
        scored.sort(key=lambda x: x.get("overall_score", 0), reverse=True)

        # Assign ranks
        for i, c in enumerate(scored):
            c["rank"] = i + 1

        return scored

    def _compute_candidate_score(
        self,
        candidate: Dict,
        job: Dict,
    ) -> Dict[str, Any]:
        resume = candidate.get("resume", {}) or {}
        application = candidate.get("application", {}) or {}

        # Get or compute individual scores
        ats_score = float(application.get("ats_score") or resume.get("ats_score") or 0)
        semantic_score = float(application.get("semantic_match_score") or 0)
        skills_score = float(application.get("skills_match_score") or 0)

        # Compute experience score
        experience_score = self._compute_experience_score(
            resume.get("experience", []) or [],
            job.get("min_experience_years", 0),
            job.get("max_experience_years"),
        )

        # If scores not pre-computed, estimate from resume
        if not semantic_score or not skills_score:
            from app.ai.semantic_matcher import semantic_matcher
            match_result = semantic_matcher.match_resume_to_job(resume, job)
            semantic_score = match_result["semantic_score"]
            skills_score = match_result["skills_score"]

        # Weighted overall score
        overall = (
            ats_score * self.WEIGHTS["ats_score"] +
            semantic_score * self.WEIGHTS["semantic_match"] +
            skills_score * self.WEIGHTS["skills_match"] +
            experience_score * self.WEIGHTS["experience_match"]
        )

        # Bonus modifiers
        overall = self._apply_bonus_modifiers(overall, resume, job)

        # Generate explainable AI breakdown
        explanation = self._generate_explanation(
            ats_score, semantic_score, skills_score, experience_score, overall, candidate, job
        )

        return {
            "overall_score": round(overall, 1),
            "ats_score": round(ats_score, 1),
            "semantic_match_score": round(semantic_score, 1),
            "skills_match_score": round(skills_score, 1),
            "experience_match_score": round(experience_score, 1),
            "score_explanation": explanation,
            "performance_tier": self._get_tier(overall),
        }

    def _compute_experience_score(
        self,
        experience: List[Dict],
        min_years: int,
        max_years: Optional[int],
    ) -> float:
        num_jobs = len(experience)

        # Estimate years from number of jobs (simplified)
        estimated_years = num_jobs * 1.5

        if estimated_years >= max(min_years, 1):
            score = 90.0
            # Slight penalty if over-qualified
            if max_years and estimated_years > max_years * 1.5:
                score = 70.0
        elif estimated_years >= min_years * 0.7:
            score = 70.0
        elif estimated_years >= min_years * 0.5:
            score = 50.0
        else:
            score = 30.0 if num_jobs > 0 else 10.0

        return score

    def _apply_bonus_modifiers(
        self,
        score: float,
        resume: Dict,
        job: Dict,
    ) -> float:
        # Certification bonus (+2 per cert, max +8)
        certs = resume.get("certifications", []) or []
        cert_bonus = min(len(certs) * 2, 8)
        score += cert_bonus

        # Project relevance bonus
        projects = resume.get("projects", []) or []
        if projects:
            required_skills = {s.lower() for s in (job.get("required_skills", []) or [])}
            for project in projects:
                proj_skills = {s.lower() for s in (project.get("technologies", []) or [])}
                if proj_skills & required_skills:
                    score += 2
                    break  # Only +2 once

        return min(score, 100)

    def _generate_explanation(
        self,
        ats_score: float,
        semantic_score: float,
        skills_score: float,
        exp_score: float,
        overall: float,
        candidate: Dict,
        job: Dict,
    ) -> Dict[str, Any]:
        """Generate human-readable explanation for the score (Explainable AI)."""
        resume = candidate.get("resume", {}) or {}
        application = candidate.get("application", {}) or {}

        factors = []

        # ATS Factor
        factors.append({
            "factor": "Resume ATS Compatibility",
            "score": round(ats_score, 1),
            "weight": "25%",
            "contribution": round(ats_score * self.WEIGHTS["ats_score"], 1),
            "description": self._describe_ats(ats_score),
            "icon": "document",
        })

        # Semantic Match Factor
        factors.append({
            "factor": "Job Description Alignment",
            "score": round(semantic_score, 1),
            "weight": "35%",
            "contribution": round(semantic_score * self.WEIGHTS["semantic_match"], 1),
            "description": self._describe_semantic(semantic_score),
            "icon": "brain",
        })

        # Skills Match Factor
        matched = application.get("matched_skills", []) or []
        missing = application.get("missing_skills", []) or []
        factors.append({
            "factor": "Skills Match",
            "score": round(skills_score, 1),
            "weight": "25%",
            "contribution": round(skills_score * self.WEIGHTS["skills_match"], 1),
            "description": f"Matches {len(matched)} of {len(matched) + len(missing)} required skills",
            "matched_skills": matched[:8],
            "missing_skills": missing[:8],
            "icon": "skills",
        })

        # Experience Factor
        factors.append({
            "factor": "Experience Relevance",
            "score": round(exp_score, 1),
            "weight": "15%",
            "contribution": round(exp_score * self.WEIGHTS["experience_match"], 1),
            "description": self._describe_experience(exp_score, resume.get("experience", []) or []),
            "icon": "briefcase",
        })

        return {
            "factors": factors,
            "overall_assessment": self._overall_assessment(overall),
            "recommendation": self._get_recommendation(overall),
            "strengths": self._identify_strengths(resume, application),
            "improvements": self._identify_improvements(resume, application),
        }

    def _describe_ats(self, score: float) -> str:
        if score >= 80:
            return "Excellent ATS compatibility. Resume is well-structured for automated screening."
        elif score >= 60:
            return "Good ATS score. Minor formatting improvements could increase visibility."
        elif score >= 40:
            return "Average ATS score. Resume needs keyword optimization and better structure."
        else:
            return "Low ATS score. Significant improvements needed for automated screening."

    def _describe_semantic(self, score: float) -> str:
        if score >= 80:
            return "Strong semantic alignment. Resume closely matches the job's language and requirements."
        elif score >= 60:
            return "Good content alignment with the job description."
        elif score >= 40:
            return "Moderate alignment. More relevant experience and skills should be highlighted."
        else:
            return "Low content alignment with this specific job."

    def _describe_experience(self, score: float, experience: List) -> str:
        num_jobs = len(experience)
        if score >= 80:
            return f"Strong experience profile with {num_jobs} relevant positions."
        elif score >= 60:
            return f"Adequate experience ({num_jobs} positions). Meets minimum requirements."
        else:
            return f"Experience ({num_jobs} positions) may be below job requirements."

    def _overall_assessment(self, score: float) -> str:
        if score >= 80:
            return "Highly Recommended — Excellent candidate for this role"
        elif score >= 65:
            return "Recommended — Strong candidate worth interviewing"
        elif score >= 50:
            return "Consider — Meets basic requirements, potential for growth"
        elif score >= 35:
            return "Borderline — Does not fully meet requirements"
        else:
            return "Not Recommended — Significant skill/experience gaps"

    def _get_recommendation(self, score: float) -> str:
        if score >= 75:
            return "shortlist"
        elif score >= 55:
            return "review"
        else:
            return "pass"

    def _get_tier(self, score: float) -> str:
        if score >= 80:
            return "A"
        elif score >= 65:
            return "B"
        elif score >= 50:
            return "C"
        else:
            return "D"

    def _identify_strengths(self, resume: Dict, application: Dict) -> List[str]:
        strengths = []
        if len(resume.get("certifications", []) or []) >= 2:
            strengths.append("Multiple professional certifications")
        if len(resume.get("projects", []) or []) >= 3:
            strengths.append("Strong portfolio of projects")
        if len(resume.get("experience", []) or []) >= 3:
            strengths.append("Extensive work experience")
        if len(resume.get("skills", []) or []) >= 12:
            strengths.append("Broad technical skill set")
        if resume.get("summary"):
            strengths.append("Professional summary demonstrates career clarity")
        return strengths[:5]

    def _identify_improvements(self, resume: Dict, application: Dict) -> List[str]:
        improvements = []
        if not resume.get("summary"):
            improvements.append("Add a professional summary")
        if len(resume.get("skills", []) or []) < 8:
            improvements.append("Expand skills section")
        missing = application.get("missing_skills", []) or []
        if missing:
            improvements.append(f"Acquire missing skills: {', '.join(missing[:3])}")
        if not resume.get("certifications"):
            improvements.append("Obtain relevant certifications")
        return improvements[:4]


# Singleton
candidate_ranker = CandidateRanker()
