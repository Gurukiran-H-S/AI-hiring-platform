import os
import sys
import re
from typing import Dict, List, Any, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml.preprocessing.skill_normalizer import skill_normalizer

class JobParser:
    """Parses raw job descriptions to extract required skills, experience, and metadata."""

    def parse(self, text: str) -> Dict[str, Any]:
        if not text:
            return {}

        # 1. Skill extraction using master skill dictionary lookup
        required_skills = []
        text_lower = text.lower()
        for k in skill_normalizer.aliases.keys():
            if re.search(r'\b' + re.escape(k) + r'\b', text_lower):
                required_skills.append(skill_normalizer.aliases[k])
        required_skills = list(set(required_skills))

        # 2. Minimum experience extraction
        min_experience_years = 0
        exp_match = re.search(r'(\d+)\+?\s*(?:year|yr)s?\s*(?:of\s*)?experience', text_lower)
        if exp_match:
            min_experience_years = int(exp_match.group(1))

        # 3. Required education extraction
        required_education = "Bachelor's Degree"
        if "master" in text_lower or "m.tech" in text_lower or "phd" in text_lower:
            required_education = "Master's or Ph.D."
        elif "diploma" in text_lower:
            required_education = "Diploma"

        return {
            "required_skills": required_skills,
            "min_experience_years": min_experience_years,
            "required_education": required_education,
            "location": self._extract_location(text)
        }

    def _extract_location(self, text: str) -> Optional[str]:
        # Basic check for Remote/On-site/Hybrid
        text_lower = text.lower()
        if "remote" in text_lower:
            return "Remote"
        if "hybrid" in text_lower:
            return "Hybrid"
        return "On-Site"

job_parser = JobParser()
