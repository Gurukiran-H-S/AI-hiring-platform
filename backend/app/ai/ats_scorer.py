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

    # Configurable weights matching humanized ATS prompt specification (Section 3)
    WEIGHTS = {
        "skill_match": 0.30,
        "keyword_match": 0.15,
        "semantic_match": 0.20,
        "experience_match": 0.15,
        "education_match": 0.10,
        "project_match": 0.10,
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

        # 2. Keyword Coverage Score (15%)
        keyword_score = self._score_keywords(parsed_resume, job_description)

        # 3. Semantic Job Match Score (20%)
        semantic_match_score = self._compute_semantic_score(parsed_resume, job_description)

        # 4. Experience Match Score (15%)
        experience_score, exp_issues = self._score_experience(parsed_resume)

        # 5. Education Match Score (10%)
        education_score = self._score_education(parsed_resume)

        # 6. Project Relevance Score (10%)
        project_score = self._score_projects(parsed_resume)

        # Weighted Sum matching the humanized formula (Section 3)
        ats_score = (
            skill_match_score * self.WEIGHTS["skill_match"] +
            keyword_score * self.WEIGHTS["keyword_match"] +
            semantic_match_score * self.WEIGHTS["semantic_match"] +
            experience_score * self.WEIGHTS["experience_match"] +
            education_score * self.WEIGHTS["education_match"] +
            project_score * self.WEIGHTS["project_match"]
        )

        ats_score = round(ats_score, 1)
        level_info = self._get_score_level(ats_score)

        # Generate threshold warning and recommendation details
        rec_improvements = []
        if "SQL" not in cand_skill_names:
            rec_improvements.append("You need to learn SQL to improve your ATS score.")
        if "REST API" not in cand_skill_names:
            rec_improvements.append("You need to learn REST API to improve your ATS score.")
            
        for s in missing_skills[:4]:
            rec_improvements.append(f"Learn fundamentals of {s}")
        rec_improvements.append("Add quantified metrics (e.g. 'Increased accuracy by 25%') to work experience bullets.")

        threshold_warning = {
            "active": True if ats_score < 75.0 or rec_improvements else False,
            "status": level_info["level"],
            "message": f"Your profile currently matches {ats_score}% of the selected job requirements.",
            "missing_skills": missing_skills,
            "recommended_improvements": rec_improvements
        }

        return {
            "ats_score": ats_score,
            "level": level_info["level"],
            "badge_color": level_info["color"],
            "score_breakdown": {
                "skill_score": round(skill_match_score, 1),
                "keyword_score": round(keyword_score, 1),
                "semantic_score": round(semantic_match_score, 1),
                "experience_score": round(experience_score, 1),
                "education_score": round(education_score, 1),
                "project_score": round(project_score, 1),
            },
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "threshold_warning": threshold_warning,
            "explanation": f"Overall ATS Score of {ats_score}% calculated based on weighted criteria (30% Skill Match, 15% Keyword Match, 20% Semantic Match, 15% Experience Match, 10% Education Match, 10% Project Match)."
        }

    def _compute_semantic_score(self, resume: Dict, job_desc: Optional[str]) -> float:
        if not job_desc:
            return 70.0

        # Preferred path: real transformer embeddings (all-MiniLM-L6-v2)
        try:
            from app.ai.semantic_matcher import semantic_matcher
            resume_text = semantic_matcher._resume_to_text(resume) or str(resume)[:5000]
            similarity = semantic_matcher.compute_similarity(
                semantic_matcher.encode(resume_text[:5000]),
                semantic_matcher.encode(job_desc[:5000]),
            )
            # Cosine similarity of MiniLM typically lands in [-0.1, 1]; rescale
            # to a useful 0-100 band (0.0 -> 0, 0.4 -> 50, >=0.8 -> 100).
            scaled = max(0.0, min(100.0, (similarity / 0.8) * 100.0))
            return scaled
        except Exception as e:
            logger.warning(f"Embedding-based semantic score unavailable ({e}); using token-overlap fallback.")

        # Fallback: token overlap heuristic
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


    def calculate_match_score(
        self,
        parsed_resume: Dict[str, Any],
        job_description: Optional[str] = None,
        required_skills: Optional[List[str]] = None,
        preferred_skills: Optional[List[str]] = None,
        min_experience_years: int = 0,
        required_education: Optional[str] = None
    ) -> Dict[str, Any]:
        """Calculates candidate-to-job match score based on Part 7 weights (40/20/15/10/10/5)."""
        raw_skills = parsed_resume.get("skills", []) or []
        normalized_skills = skill_normalizer.normalize_list(raw_skills)
        cand_skill_names = [s["normalized_skill"] for s in normalized_skills]

        # 1. Skill Match Score (40%)
        req_skills_normalized = [skill_normalizer.normalize(s)["normalized_skill"] for s in (required_skills or [])]
        if not req_skills_normalized:
            req_skills_normalized = ["Python", "SQL", "Git"]  # default backup
        matched_required = [s for s in req_skills_normalized if s in cand_skill_names]
        missing_required = [s for s in req_skills_normalized if s not in cand_skill_names]
        skill_score = (len(matched_required) / max(1, len(req_skills_normalized))) * 100.0

        # 2. Preferred Skills (5%)
        pref_skills_normalized = [skill_normalizer.normalize(s)["normalized_skill"] for s in (preferred_skills or [])]
        matched_pref = [s for s in pref_skills_normalized if s in cand_skill_names] if pref_skills_normalized else []
        pref_score = (len(matched_pref) / max(1, len(pref_skills_normalized))) * 100.0 if pref_skills_normalized else 100.0

        # 3. Experience Match Score (20%)
        cand_exp_items = parsed_resume.get("experience", []) or []
        cand_years = len(cand_exp_items) * 2  # assume 2 years per experience item on average
        if cand_years >= min_experience_years:
            experience_match_score = 100.0
            exp_match_label = "High"
        else:
            experience_match_score = 50.0
            exp_match_label = "Low (Below the stated requirement)"
            
        # 4. Semantic Match Score (15%)
        semantic_score = self._compute_semantic_score(parsed_resume, job_description)

        # 5. Project Relevance Score (10%)
        # Check if candidate has projects, support freshers/students
        proj_items = parsed_resume.get("projects", []) or []
        if len(proj_items) >= 2:
            project_score = 100.0
            proj_match_label = "High"
        elif len(proj_items) == 1:
            project_score = 75.0
            proj_match_label = "Medium"
        else:
            project_score = 30.0
            proj_match_label = "Low"

        # 6. Education Match Score (10%)
        # Look for education matching
        edu_items = parsed_resume.get("education", []) or []
        education_score = 50.0
        edu_match_label = "Low"
        if not required_education:
            education_score = 100.0
            edu_match_label = "Matched"
        else:
            req_edu_lower = required_education.lower()
            for edu in edu_items:
                edu_text = str(edu).lower()
                if any(kw in edu_text for kw in ["bachelor", "master", "ph.d", "b.tech", "b.e.", "computer science"]):
                    education_score = 100.0
                    edu_match_label = "Matched"
                    break

        # Weighted Sum matching Part 7
        match_score = (
            skill_score * 0.40 +
            experience_match_score * 0.20 +
            semantic_score * 0.15 +
            project_score * 0.10 +
            education_score * 0.10 +
            pref_score * 0.05
        )

        match_score = round(match_score, 1)

        return {
            "match_score": match_score,
            "skill_score": round(skill_score, 1),
            "experience_score": round(experience_match_score, 1),
            "semantic_score": round(semantic_score, 1),
            "project_score": round(project_score, 1),
            "education_score": round(education_score, 1),
            "preferred_score": round(pref_score, 1),
            "matched_skills": matched_required,
            "missing_skills": missing_required,
            "experience_match": exp_match_label,
            "project_match": proj_match_label,
            "education_match": edu_match_label,
            "matched_preferred": matched_pref,
        }


ats_scorer = ATSScorer()
