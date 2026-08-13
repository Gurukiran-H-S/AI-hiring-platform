import os
import sys
import re
from typing import Dict, List, Any
from rapidfuzz import process, fuzz

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal
from app.models.ml_models import Skill, SkillAlias

class SkillNormalizer:
    """Fuzzy and abbreviation-mapped skill normalization engine."""

    def __init__(self):
        self.aliases: Dict[str, str] = {}
        self.skills: List[str] = []
        self._load_aliases()

    def _load_aliases(self):
        """Loads canonical skills and aliases from database or fallback defaults."""
        db = SessionLocal()
        try:
            skills = db.query(Skill).all()
            for sk in skills:
                self.skills.append(sk.canonical_name)
                # Map self to self
                self.aliases[sk.canonical_name.lower()] = sk.canonical_name
                for al in sk.aliases:
                    self.aliases[al.alias.lower()] = sk.canonical_name
        except Exception:
            # Fallback mappings in case DB is unpopulated/offline
            fallback = {
                "nlp": "Natural Language Processing",
                "ml": "Machine Learning",
                "dl": "Deep Learning",
                "restful apis": "REST API",
                "restful api": "REST API",
                "restful services": "REST API",
                "rest apis": "REST API",
                "sklearn": "scikit-learn",
                "postgres": "PostgreSQL",
                "reactjs": "React",
                "react js": "React"
            }
            for k, v in fallback.items():
                self.aliases[k] = v
                if v not in self.skills:
                    self.skills.append(v)
        finally:
            db.close()

    def normalize(self, skill_name: str) -> Dict[str, Any]:
        """Normalize a skill name string into its canonical form."""
        if not skill_name:
            return {"raw_skill": "", "normalized_skill": "", "confidence": 0.0}

        cleaned = skill_name.strip().lower()
        cleaned = re.sub(r'[\s\-]+', ' ', cleaned)  # Normalize whitespace and hyphens
        cleaned = re.sub(r'[^\w\s\.\+#]', '', cleaned)  # Keep letters, numbers, dot, +, #

        # 1. Exact alias match
        if cleaned in self.aliases:
            return {
                "raw_skill": skill_name,
                "normalized_skill": self.aliases[cleaned],
                "confidence": 1.0
            }

        # Plural/Singular basic check (e.g. apis -> api)
        if cleaned.endswith("s") and cleaned[:-1] in self.aliases:
            return {
                "raw_skill": skill_name,
                "normalized_skill": self.aliases[cleaned[:-1]],
                "confidence": 0.95
            }

        # 2. Fuzzy match against canonical skills list
        if self.skills:
            match = process.extractOne(skill_name, self.skills, scorer=fuzz.token_sort_ratio)
            if match:
                best_name, score, _ = match
                if score >= 80.0:
                    return {
                        "raw_skill": skill_name,
                        "normalized_skill": best_name,
                        "confidence": round(score / 100.0, 2)
                    }

        # Fallback to Title Cased cleaned name
        return {
            "raw_skill": skill_name,
            "normalized_skill": skill_name.strip().title(),
            "confidence": 0.50
        }

    def normalize_list(self, skill_names: List[str]) -> List[Dict[str, Any]]:
        """Normalize a list of skill name strings."""
        normalized = []
        seen = set()
        for s in skill_names:
            res = self.normalize(s)
            norm_name = res["normalized_skill"]
            if norm_name and norm_name not in seen:
                normalized.append(res)
                seen.add(norm_name)
        return normalized

skill_normalizer = SkillNormalizer()
