import os
import sys
import numpy as np
from typing import Dict, Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml.inference.model_loader import model_loader

def get_embedding(text: str) -> np.ndarray:
    """Generate vector embeddings for a given text segment."""
    embedder = model_loader.embedder
    return embedder.encode(text)

def compute_cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Compute cosine similarity score between two vector representations."""
    dot_val = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(dot_val / (norm1 * norm2))

def match_resume_to_job(resume_text: str, job_description: str) -> Dict[str, Any]:
    """Calculate matching similarity rating between resume and job specification."""
    emb1 = get_embedding(resume_text)
    emb2 = get_embedding(job_description)
    sim = compute_cosine_similarity(emb1, emb2)
    return {
        "semantic_score": round(sim * 100.0, 1),
        "similarity_coefficient": sim
    }
