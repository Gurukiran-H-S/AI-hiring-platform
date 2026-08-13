import os
import sys
import joblib
from typing import Dict, Any, List

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

MODEL_FILE = os.path.join("ml", "models", "ranking", "candidate_ranker.joblib")

class RankingInference:
    """Loads XGBoost/Random Forest candidate ranker model and infers selection compatibility."""

    def __init__(self):
        self.model = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(MODEL_FILE):
            try:
                self.model = joblib.load(MODEL_FILE)
            except Exception:
                self.model = None

    def predict_selected(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Predict candidate selected/rejected outcome based on evaluation features."""
        # Feature columns list
        cols = ["ats_score", "skill_score", "keyword_score", "semantic_score", 
                "experience_score", "education_score", "project_score", 
                "coding_score", "aptitude_score", "interview_score"]
        
        # Assemble input vector
        vec = [features.get(c, 0.0) for c in cols]

        # In case of insufficient data (rule-based stub)
        if self.model is None or (isinstance(self.model, dict) and self.model.get("type") == "rule_based_fallback"):
            # Deterministic threshold rule-based fallback
            overall = sum(vec) / len(cols)
            selected = overall >= 75.0
            prob = overall / 100.0
            return {
                "selected": selected,
                "selection_probability": round(prob, 2),
                "is_fallback": True,
                "overall_fit_index": round(overall, 1)
            }
        
        # Run inference using the trained XGBoost/RandomForest model
        try:
            pred = self.model.predict([vec])[0]
            prob = self.model.predict_proba([vec])[0][1]
            return {
                "selected": bool(pred),
                "selection_probability": round(float(prob), 2),
                "is_fallback": False
            }
        except Exception:
            overall = sum(vec) / len(cols)
            selected = overall >= 75.0
            return {
                "selected": selected,
                "selection_probability": round(overall / 100.0, 2),
                "is_fallback": True
            }

ranking_inference = RankingInference()
