"""
Skill Normalization Layer
Normalizes skill synonyms, variants, and abbreviations to standard canonical names with confidence scoring.
"""

from typing import Dict, Any, List

SKILL_SYNONYMS = {
    # Programming Languages
    "js": ("JavaScript", "Programming Language", 0.98),
    "javascript": ("JavaScript", "Programming Language", 1.0),
    "ts": ("TypeScript", "Programming Language", 0.98),
    "typescript": ("TypeScript", "Programming Language", 1.0),
    "py": ("Python", "Programming Language", 0.98),
    "python": ("Python", "Programming Language", 1.0),
    "golang": ("Go", "Programming Language", 0.98),
    "cpp": ("C++", "Programming Language", 0.98),
    "c++": ("C++", "Programming Language", 1.0),
    "c#": ("C#", "Programming Language", 1.0),

    # Frameworks
    "reactjs": ("React", "Frontend Framework", 0.98),
    "react.js": ("React", "Frontend Framework", 0.98),
    "react": ("React", "Frontend Framework", 1.0),
    "vuejs": ("Vue.js", "Frontend Framework", 0.98),
    "vue": ("Vue.js", "Frontend Framework", 0.98),
    "nextjs": ("Next.js", "Fullstack Framework", 0.98),
    "next.js": ("Next.js", "Fullstack Framework", 0.98),
    "nodejs": ("Node.js", "Backend Runtime", 0.98),
    "node.js": ("Node.js", "Backend Runtime", 1.0),
    "expressjs": ("Express.js", "Backend Framework", 0.98),
    "fastapi": ("FastAPI", "Backend Framework", 1.0),
    "django": ("Django", "Backend Framework", 1.0),
    "flask": ("Flask", "Backend Framework", 1.0),
    "spring boot": ("Spring Boot", "Backend Framework", 0.98),

    # Databases
    "postgres": ("PostgreSQL", "Database", 0.98),
    "postgresql": ("PostgreSQL", "Database", 1.0),
    "mongo": ("MongoDB", "Database", 0.95),
    "mongodb": ("MongoDB", "Database", 1.0),
    "mssql": ("Microsoft SQL Server", "Database", 0.95),
    "redis": ("Redis", "Database", 1.0),

    # Cloud & DevOps
    "aws": ("AWS", "Cloud Platform", 1.0),
    "amazon web services": ("AWS", "Cloud Platform", 0.98),
    "gcp": ("Google Cloud Platform", "Cloud Platform", 0.98),
    "k8s": ("Kubernetes", "DevOps & Containerization", 0.98),
    "kubernetes": ("Kubernetes", "DevOps & Containerization", 1.0),
    "docker": ("Docker", "DevOps & Containerization", 1.0),

    # AI / ML
    "ml": ("Machine Learning", "AI & Machine Learning", 0.95),
    "machine learning": ("Machine Learning", "AI & Machine Learning", 1.0),
    "dl": ("Deep Learning", "AI & Machine Learning", 0.95),
    "deep learning": ("Deep Learning", "AI & Machine Learning", 1.0),
    "tf": ("TensorFlow", "AI & Machine Learning", 0.95),
    "tensorflow": ("TensorFlow", "AI & Machine Learning", 1.0),
    "pytorch": ("PyTorch", "AI & Machine Learning", 1.0),
    "nlp": ("Natural Language Processing", "AI & Machine Learning", 0.95),
    "cv": ("Computer Vision", "AI & Machine Learning", 0.90),
}


class SkillNormalizer:
    """Normalizes skill strings into structured canonical records."""

    def normalize(self, skill_name: str) -> Dict[str, Any]:
        raw = (skill_name or "").strip()
        key = raw.lower()

        if key in SKILL_SYNONYMS:
            canonical, category, confidence = SKILL_SYNONYMS[key]
            return {
                "original_skill": raw,
                "normalized_skill": canonical,
                "category": category,
                "confidence_score": confidence,
            }

        # Title case fallback
        return {
            "original_skill": raw,
            "normalized_skill": raw.title(),
            "category": "General Technical",
            "confidence_score": 0.85,
        }

    def normalize_list(self, skills: List[str]) -> List[Dict[str, Any]]:
        seen = set()
        results = []
        for s in skills:
            norm = self.normalize(s)
            canonical = norm["normalized_skill"]
            if canonical not in seen:
                seen.add(canonical)
                results.append(norm)
        return results


skill_normalizer = SkillNormalizer()
