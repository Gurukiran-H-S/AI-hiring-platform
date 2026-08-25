"""
Semantic Resume-to-Job Matcher
Uses Sentence Transformers (BERT-based) for semantic similarity matching.
Falls back to TF-IDF cosine similarity if transformers are unavailable.
"""

import logging
import re
import time
from typing import Dict, List, Tuple, Optional, Any
import numpy as np

logger = logging.getLogger(__name__)


# Global singleton instance for SentenceTransformer across the entire application
_GLOBAL_MODEL = None
_GLOBAL_MODEL_INITIALIZED = False


def get_embedding_model(model_name: str = "all-MiniLM-L6-v2"):
    """
    Get or initialize the shared global SentenceTransformer model instance.
    Configured explicitly for CPU execution with single-thread allocation.
    """
    global _GLOBAL_MODEL, _GLOBAL_MODEL_INITIALIZED
    if _GLOBAL_MODEL is None and not _GLOBAL_MODEL_INITIALIZED:
        _GLOBAL_MODEL_INITIALIZED = True
        try:
            import torch
            # Limit CPU threads to avoid contention and memory spikes on constrained instances
            torch.set_num_threads(1)
            
            logger.info(f"MODEL INITIALIZATION START: Loading SentenceTransformer '{model_name}' on CPU...")
            start_t = time.time()
            from sentence_transformers import SentenceTransformer
            _GLOBAL_MODEL = SentenceTransformer(model_name, device="cpu")
            elapsed = time.time() - start_t
            logger.info(f"MODEL INITIALIZATION COMPLETE: Loaded '{model_name}' in {elapsed:.2f}s")
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer '{model_name}': {e}. Using lightweight TF-IDF fallback.")
            _GLOBAL_MODEL = False
    return _GLOBAL_MODEL if _GLOBAL_MODEL is not False else None


class SemanticMatcher:
    """
    Semantic similarity matching between resumes and job descriptions
    using shared sentence-transformers (all-MiniLM-L6-v2) singleton.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._tfidf = None

    def initialize_model(self):
        """Warm up the embedding model during application startup."""
        return get_embedding_model(self.model_name)

    def encode(self, text: str) -> List[float]:
        """Encode text to a semantic embedding vector reusing the singleton model."""
        if not text or not text.strip():
            return [0.0] * 64
        
        start_t = time.time()
        truncated = text[:1000].strip()
        try:
            model = get_embedding_model(self.model_name)
            if model:
                import torch
                with torch.inference_mode():
                    embedding = model.encode(
                        truncated,
                        convert_to_tensor=False,
                        show_progress_bar=False,
                        normalize_embeddings=True,
                    )
                elapsed = time.time() - start_t
                logger.info(f"Resume embedding completed in {elapsed:.3f} seconds (text_len={len(truncated)})")
                if hasattr(embedding, "tolist"):
                    return embedding.tolist()
                return [float(x) for x in embedding]
            else:
                return self._tfidf_encode(truncated)
        except Exception as e:
            logger.warning(f"SentenceTransformer encode fallback: {e}")
            return self._tfidf_encode(truncated)

    def compute_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Compute cosine similarity between two embedding vectors."""
        v1 = np.array(embedding1)
        v2 = np.array(embedding2)
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(np.dot(v1, v2) / (norm1 * norm2))

    def match_resume_to_job(
        self,
        resume_data: Dict[str, Any],
        job_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Full matching pipeline: semantic + skills + experience matching.
        Returns overall score with explainable breakdown.
        """
        resume_text = self._resume_to_text(resume_data)
        job_text = self._job_to_text(job_data)

        # 1. Semantic similarity (40% weight)
        resume_emb = self.encode(resume_text)
        job_emb = self.encode(job_text)
        semantic_score = self.compute_similarity(resume_emb, job_emb) * 100

        # 2. Skills matching (35% weight)
        skills_score, matched_skills, missing_skills = self._match_skills(
            resume_data.get("skills", []) or [],
            job_data.get("required_skills", []) or [],
            job_data.get("preferred_skills", []) or [],
        )

        # 3. Experience matching (15% weight)
        exp_score = self._match_experience(
            resume_data.get("experience", []) or [],
            job_data.get("min_experience_years", 0),
        )

        # 4. Education matching (10% weight)
        edu_score = self._match_education(
            resume_data.get("education", []) or [],
            job_data.get("required_education", ""),
        )

        # Weighted overall score
        overall = (
            semantic_score * 0.40 +
            skills_score * 0.35 +
            exp_score * 0.15 +
            edu_score * 0.10
        )

        explanation = {
            "semantic_similarity": {
                "score": round(semantic_score, 1),
                "weight": "40%",
                "description": "How well your resume's content aligns with the job description",
            },
            "skills_match": {
                "score": round(skills_score, 1),
                "weight": "35%",
                "description": f"You have {len(matched_skills)}/{len(matched_skills) + len(missing_skills)} required skills",
                "matched": matched_skills[:10],
                "missing": missing_skills[:10],
            },
            "experience_match": {
                "score": round(exp_score, 1),
                "weight": "15%",
                "description": "How your work experience matches the job requirements",
            },
            "education_match": {
                "score": round(edu_score, 1),
                "weight": "10%",
                "description": "Educational qualification match",
            },
        }

        return {
            "overall_score": round(overall, 1),
            "semantic_score": round(semantic_score, 1),
            "skills_score": round(skills_score, 1),
            "experience_score": round(exp_score, 1),
            "education_score": round(edu_score, 1),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "explanation": explanation,
            "resume_embedding": resume_emb,
            "match_label": self._get_match_label(overall),
        }

    def batch_match_jobs(
        self,
        resume_data: Dict,
        jobs: List[Dict],
        top_k: int = 10,
    ) -> List[Dict]:
        """Match a resume against multiple jobs and return ranked results."""
        results = []
        resume_text = self._resume_to_text(resume_data)
        resume_emb = self.encode(resume_text)

        for job in jobs:
            job_text = self._job_to_text(job)
            job_emb = job.get("description_embedding") or self.encode(job_text)

            semantic_score = self.compute_similarity(resume_emb, job_emb) * 100
            skills_score, matched, missing = self._match_skills(
                resume_data.get("skills", []) or [],
                job.get("required_skills", []) or [],
                job.get("preferred_skills", []) or [],
            )

            overall = semantic_score * 0.55 + skills_score * 0.45

            results.append({
                "job_id": str(job.get("id", "")),
                "job_title": job.get("title", ""),
                "company": job.get("company", ""),
                "location": job.get("location", ""),
                "semantic_score": round(semantic_score, 1),
                "skills_score": round(skills_score, 1),
                "overall_match": round(overall, 1),
                "matched_skills": matched,
                "missing_skills": missing,
                "match_label": self._get_match_label(overall),
            })

        results.sort(key=lambda x: x["overall_match"], reverse=True)
        return results[:top_k]

    def _match_skills(
        self,
        candidate_skills: List[str],
        required_skills: List[str],
        preferred_skills: List[str],
    ) -> Tuple[float, List[str], List[str]]:
        candidate_lower = {s.lower() for s in candidate_skills}
        required_lower = [s.lower() for s in required_skills]
        preferred_lower = [s.lower() for s in preferred_skills]

        matched_required = [s for s in required_lower if s in candidate_lower]
        matched_preferred = [s for s in preferred_lower if s in candidate_lower]
        missing_required = [s for s in required_lower if s not in candidate_lower]

        if not required_lower and not preferred_lower:
            return 50.0, [], []

        required_score = (len(matched_required) / max(len(required_lower), 1)) * 80
        preferred_score = (len(matched_preferred) / max(len(preferred_lower), 1)) * 20

        total_score = required_score + preferred_score

        all_matched = list(set([s.title() for s in matched_required + matched_preferred]))
        all_missing = list(set([s.title() for s in missing_required]))

        return min(total_score, 100), all_matched, all_missing

    def _match_experience(self, experience: List[Dict], min_years: int) -> float:
        if not experience:
            return 20.0 if min_years == 0 else 10.0

        num_jobs = len(experience)
        if num_jobs >= 3 or min_years <= 1:
            return 90.0
        elif num_jobs >= 2:
            return 75.0
        elif num_jobs >= 1:
            return 55.0
        return 20.0

    def _match_education(self, education: List[Dict], required_edu: Optional[str]) -> float:
        if not required_edu:
            return 80.0  # No specific requirement
        if not education:
            return 30.0

        edu_text = " ".join([str(e.get("degree", "")) for e in education]).lower()
        req_lower = required_edu.lower()

        # Check degree level
        degree_hierarchy = {
            "phd": ["phd", "doctorate", "d.phil"],
            "masters": ["master", "m.tech", "m.sc", "m.e", "mba", "mca"],
            "bachelors": ["bachelor", "b.tech", "b.e", "b.sc", "be", "bca", "bsc"],
            "diploma": ["diploma", "associate"],
        }

        required_level = None
        for level, keywords in degree_hierarchy.items():
            if any(k in req_lower for k in keywords):
                required_level = level
                break

        if not required_level:
            return 70.0

        level_order = ["diploma", "bachelors", "masters", "phd"]
        for level, keywords in degree_hierarchy.items():
            if any(k in edu_text for k in keywords):
                candidate_level = level
                if level_order.index(candidate_level) >= level_order.index(required_level):
                    return 95.0
                else:
                    return 50.0

        return 40.0

    def _get_match_label(self, score: float) -> str:
        if score >= 80:
            return "Excellent Match"
        elif score >= 65:
            return "Good Match"
        elif score >= 50:
            return "Fair Match"
        elif score >= 35:
            return "Partial Match"
        else:
            return "Low Match"

    def _resume_to_text(self, resume: Dict) -> str:
        parts = [
            resume.get("summary", "") or "",
            " ".join(resume.get("skills", []) or []),
            " ".join(
                (e.get("title", "") or "") + " " + (e.get("description", "") or "")
                for e in (resume.get("experience", []) or [])
            ),
            " ".join(
                (e.get("degree", "") or "") for e in (resume.get("education", []) or [])
            ),
            " ".join(
                (c.get("name", "") or "") for c in (resume.get("certifications", []) or [])
            ),
        ]
        return " ".join(p for p in parts if p).strip()

    def _job_to_text(self, job: Dict) -> str:
        parts = [
            job.get("title", "") or "",
            job.get("description", "") or "",
            " ".join(job.get("required_skills", []) or []),
            " ".join(job.get("preferred_skills", []) or []),
            " ".join(job.get("requirements", []) or []),
        ]
        return " ".join(p for p in parts if p).strip()

    def _tfidf_encode(self, text: str) -> List[float]:
        """Simple TF-IDF based encoding fallback."""
        from sklearn.feature_extraction.text import TfidfVectorizer
        try:
            vectorizer = TfidfVectorizer(max_features=512, stop_words='english')
            vector = vectorizer.fit_transform([text])
            arr = vector.toarray()[0]
            # Pad or truncate to 512
            result = arr.tolist()
            while len(result) < 512:
                result.append(0.0)
            return result[:512]
        except Exception:
            return [0.0] * 512


# Singleton
semantic_matcher = SemanticMatcher()
