import os
import sys
import joblib
from typing import Dict, Any, List

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

MODEL_FILE = os.path.join("ml", "models", "ranking", "candidate_ranker.joblib")

DEFAULT_FEATURES = [
    "ats_score", "skill_score", "keyword_score", "semantic_score",
    "experience_score", "education_score", "project_score",
    "coding_score", "aptitude_score", "interview_score",
]


class RankingInference:
    """Loads the trained GradientBoosting candidate ranker and infers selection fit.
    Falls back to a deterministic threshold rule when no trained model exists yet."""

    def __init__(self):
        self.model = None
        self.features: List[str] = DEFAULT_FEATURES
        self.version = None
        self._load_model()

    def _load_model(self):
        if not os.path.exists(MODEL_FILE):
            return
        try:
            loaded = joblib.load(MODEL_FILE)
        except Exception:
            return

        if isinstance(loaded, dict):
            # New versioned bundle format from ml/training/train_ranking_model.py
            self.model = loaded.get("model")
            self.features = loaded.get("features") or DEFAULT_FEATURES
            self.version = loaded.get("version")
            if loaded.get("type") == "rule_based_fallback":
                self.model = None  # explicit stub -> use rule fallback below
        else:
            # Legacy raw estimator files
            self.model = loaded

    def predict_selected(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Predict candidate selected/rejected outcome based on evaluation features."""
        cols = self.features or DEFAULT_FEATURES
        vec = [float(features.get(c, 0.0) or 0.0) for c in cols]

        # Rule-based fallback (no trained model available yet)
        if self.model is None:
            overall = sum(vec) / len(cols)
            selected = overall >= 75.0
            prob = overall / 100.0
            return {
                "selected": selected,
                "selection_probability": round(prob, 2),
                "is_fallback": True,
                "overall_fit_index": round(overall, 1),
                "model_version": self.version,
            }

        # Trained model inference
        try:
            pred = self.model.predict([vec])[0]
            prob = float(self.model.predict_proba([vec])[0][1])
            return {
                "selected": bool(pred),
                "selection_probability": round(prob, 2),
                "is_fallback": False,
                "model_version": self.version,
            }
        except Exception:
            overall = sum(vec) / len(cols)
            return {
                "selected": overall >= 75.0,
                "selection_probability": round(overall / 100.0, 2),
                "is_fallback": True,
                "model_version": self.version,
            }


ranking_inference = RankingInference()