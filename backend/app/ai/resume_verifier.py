"""
Resume Consistency & Authenticity Verification Module
Performs lightweight heuristic verification:
- Skills claimed vs Project/Experience evidence
- Education and employment timeline continuity
- Keyword stuffing detection
"""

import re
from typing import Dict, List, Any

class ResumeVerifier:
    """Screening tool for resume consistency and evidence analysis."""

    def verify(self, parsed_resume: Dict[str, Any]) -> Dict[str, Any]:
        issues = []
        score = 100.0

        skills = parsed_resume.get("skills", []) or []
        experience = parsed_resume.get("experience", []) or []
        projects = parsed_resume.get("projects", []) or []
        education = parsed_resume.get("education", []) or []

        resume_body = (
            " ".join(str(e.get("description", "")) for e in experience) + " " +
            " ".join(str(p.get("description", "")) for p in projects)
        ).lower()

        # 1. Skills vs Evidence Verification
        unsupported_skills = []
        for s in skills:
            if s.lower() not in resume_body and len(s) > 2:
                unsupported_skills.append(s)

        if len(unsupported_skills) >= 4:
            score -= 20.0
            issues.append(f"Skills listed without project/experience evidence: {', '.join(unsupported_skills[:4])}")
        elif len(unsupported_skills) >= 1:
            score -= 10.0
            issues.append(f"Consider adding project/work bullets demonstrating: {', '.join(unsupported_skills[:3])}")

        # 2. Timeline Continuity Verification
        exp_years = []
        for exp in experience:
            dur = str(exp.get("duration", ""))
            found_yrs = [int(y) for y in re.findall(r'\b(19|20)\d{2}\b', dur)]
            exp_years.extend(found_yrs)

        if len(exp_years) >= 2:
            exp_years.sort()
            gap = exp_years[-1] - exp_years[0]
            if gap > 15 and len(experience) < 2:
                score -= 15.0
                issues.append("Employment timeline shows significant time gap without listed history.")

        # 3. Excessive Keyword Stuffing Check
        text_len = len(str(parsed_resume))
        if len(skills) > 35:
            score -= 15.0
            issues.append("Excessive skill listing detected (>35 skills). Focus on core strengths.")

        score = max(round(score, 1), 40.0)

        # Concern level
        if score >= 85:
            concern_level = "Low Concern"
        elif score >= 65:
            concern_level = "Medium Concern"
        else:
            concern_level = "High Concern"

        return {
            "consistency_score": score,
            "concern_level": concern_level,
            "potential_issues": issues if issues else ["No significant resume inconsistencies detected."],
            "disclaimer": "AI recommendations are decision-support tools and should not replace human recruitment decisions."
        }

resume_verifier = ResumeVerifier()
