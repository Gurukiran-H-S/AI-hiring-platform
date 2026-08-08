"""
Explainable Configurable ATS Scorer Engine
Calculates weighted score based on settings:
- 30% Skill Match
- 20% Semantic Job Match
- 15% Experience Match
- 10% Education Match
- 10% Project Relevance
- 5% Certification Match
- 5% Resume Structure
- 5% Keyword Coverage
"""

import re
import logging
from typing import Dict, List, Any, Optional
from app.ai.skill_normalizer import skill_normalizer
from app.ai.resume_parser import ALL_SKILLS, EDUCATION_KEYWORDS

logger = logging.getLogger(__name__)


class ATSScorer:
    """Configurable & Explainable ATS Score Prediction Engine."""

    # Configurable weights matching prompt specification
    WEIGHTS = {
        "skill_match": 0.30,
        "semantic_match": 0.20,
        "experience_match": 0.15,
        "education_match": 0.10,
        "project_relevance": 0.10,
        "certification_match": 0.05,
        "resume_structure": 0.05,
        "keyword_coverage": 0.05,
    }

    def score(
        self,
        parsed_resume: Dict[str, Any],
        job_description: Optional[str] = None,
        job_skills: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Calculates explainable ATS score and returns breakdown + warning alerts."""
        raw_skills = parsed_resume.get("skills", []) or []
        normalized_skills = skill_normalizer.normalize_list(raw_skills)
        cand_skill_names = [s["normalized_skill"] for s in normalized_skills]

        # 1. Skill Match Score (30%)
        target_skills = [skill_normalizer.normalize(s)["normalized_skill"] for s in (job_skills or ["Python", "SQL", "Git", "REST API", "Docker"])]
        matched_skills = [s for s in target_skills if s in cand_skill_names]
        missing_skills = [s for s in target_skills if s not in cand_skill_names]

        skill_match_score = (len(matched_skills) / max(1, len(target_skills))) * 100.0

        # 2. Semantic Job Match Score (20%)
        semantic_match_score = self._compute_semantic_score(parsed_resume, job_description)

        # 3. Experience Match Score (15%)
        experience_score, exp_issues = self._score_experience(parsed_resume)

        # 4. Education Match Score (10%)
        education_score = self._score_education(parsed_resume)

        # 5. Project Relevance Score (10%)
        project_score = self._score_projects(parsed_resume)

        # 6. Certification Match Score (5%)
        cert_score = self._score_certifications(parsed_resume)

        # 7. Resume Structure Score (5%)
        structure_score = self._score_structure(parsed_resume)

        # 8. Keyword Coverage Score (5%)
        keyword_score = self._score_keywords(parsed_resume, job_description)

        # Weighted Sum
        ats_score = (
            skill_match_score * self.WEIGHTS["skill_match"] +
            semantic_match_score * self.WEIGHTS["semantic_match"] +
            experience_score * self.WEIGHTS["experience_match"] +
            education_score * self.WEIGHTS["education_match"] +
            project_score * self.WEIGHTS["project_relevance"] +
            cert_score * self.WEIGHTS["certification_match"] +
            structure_score * self.WEIGHTS["resume_structure"] +
            keyword_score * self.WEIGHTS["keyword_coverage"]
        )

        ats_score = round(ats_score, 1)
        level_info = self._get_score_level(ats_score)

        # Prompt-specified Threshold Warning (< 60 ATS Score)
        threshold_warning = None
        if ats_score < 60.0:
            threshold_warning = {
                "active": True,
                "status": "Needs Improvement",
                "message": f"Your profile currently matches {ats_score}% of the selected job requirements. Improving the highlighted skills and resume areas can significantly increase your compatibility.",
                "missing_skills": missing_skills,
                "recommended_improvements": [
                    f"Learn fundamentals of {s}" for s in missing_skills[:4]
                ] + ["Add quantified metrics (e.g. 'Increased accuracy by 25%') to work experience bullets."]
            }

        return {
            "ats_score": ats_score,
            "level": level_info["level"],
            "badge_color": level_info["color"],
            "score_breakdown": {
                "skill_score": round(skill_match_score, 1),
                "semantic_score": round(semantic_match_score, 1),
                "experience_score": round(experience_score, 1),
                "education_score": round(education_score, 1),
                "project_score": round(project_score, 1),
                "certification_score": round(cert_score, 1),
                "structure_score": round(structure_score, 1),
                "keyword_score": round(keyword_score, 1),
            },
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "threshold_warning": threshold_warning,
            "explanation": f"Overall ATS Score of {ats_score}% calculated based on weighted criteria (30% Skills, 20% Semantic, 15% Experience, 10% Education, 10% Projects, 5% Certs, 5% Structure, 5% Keywords)."
        }

    def _compute_semantic_score(self, resume: Dict, job_desc: Optional[str]) -> float:
        if not job_desc:
            return 70.0
        resume_text = str(resume).lower()
        job_terms = set(re.findall(r'\b[a-zA-Z]{3,}\b', job_desc.lower()))
        resume_terms = set(re.findall(r'\b[a-zA-Z]{3,}\b', resume_text))
        overlap = job_terms & resume_terms
        return min((len(overlap) / max(1, len(job_terms))) * 120.0, 100.0)

    def _score_experience(self, resume: Dict) -> tuple:
        exp = resume.get("experience", []) or []
        if not exp:
            return 30.0, ["Add detailed work experience"]
        score = min(len(exp) * 35.0, 100.0)
        return score, []

    def _score_education(self, resume: Dict) -> float:
        edu = resume.get("education", []) or []
        if not edu:
            return 40.0
        return min(len(edu) * 50.0, 100.0)

    def _score_projects(self, resume: Dict) -> float:
        proj = resume.get("projects", []) or []
        if not proj:
            return 30.0
        return min(len(proj) * 35.0, 100.0)

    def _score_certifications(self, resume: Dict) -> float:
        certs = resume.get("certifications", []) or []
        if not certs:
            return 20.0
        return min(len(certs) * 40.0, 100.0)

    def _score_structure(self, resume: Dict) -> float:
        required = ["summary", "skills", "experience", "education"]
        found = sum(1 for r in required if resume.get(r))
        return (found / len(required)) * 100.0

    def _score_keywords(self, resume: Dict, job_desc: Optional[str]) -> float:
        text = str(resume).lower()
        found_kw = sum(1 for k in ALL_SKILLS if k in text)
        return min(found_kw * 5.0, 100.0)

    def _get_score_level(self, score: float) -> Dict[str, str]:
        if score >= 90:
            return {"level": "Excellent Match", "color": "emerald"}
        elif score >= 75:
            return {"level": "Strong Match", "color": "indigo"}
        elif score >= 60:
            return {"level": "Moderate Match", "color": "blue"}
        elif score >= 40:
            return {"level": "Needs Improvement", "color": "amber"}
        else:
            return {"level": "Critical Improvement", "color": "rose"}


ats_scorer = ATSScorer()
