"""
Forecast inference - serves skill demand projections from the trained
Holt-Winters model bundle (ml/models/forecasting/forecast_model.pkl).

If no trained model exists, falls back to a neutral baseline so the
frontend keeps working.
"""

import os
import sys
import joblib

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

MODEL_FILE = os.path.join("ml", "models", "forecasting", "forecast_model.pkl")


class ForecastInference:
    """Serves per-skill demand forecasts produced by the monthly retrain."""

    def __init__(self):
        self.bundle = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(MODEL_FILE):
            try:
                loaded = joblib.load(MODEL_FILE)
                if isinstance(loaded, dict) and loaded.get("type") == "holt_damped_trend":
                    self.bundle = loaded
            except Exception:
                self.bundle = None

    @property
    def is_trained(self) -> bool:
        return self.bundle is not None

    def get_skill_forecast(self, skill_name: str) -> dict:
        """Demand projection for one skill over the trained horizon."""
        if self.bundle and skill_name in self.bundle.get("skills", {}):
            m = self.bundle["skills"][skill_name]
            history = m["history"]
            forecast = m["forecast"]
            current = history[-1] if history else 0.0
            projected = forecast[-1] if forecast else current
            growth = ((projected - current) / current * 100.0) if current > 0 else 0.0
            n_points = len(history)
            return {
                "skill": skill_name,
                "current_demand_index": round(current, 1),
                "forecast_next_months": forecast,
                "projected_demand": round(projected, 1),
                "projected_growth": f"{'+' if growth >= 0 else ''}{round(growth, 1)}%",
                "trend": "Emerging" if growth > 5 else ("Declining" if growth < -5 else "Stable"),
                "last_trained_month": m.get("last_month"),
                # Histories currently merge differently-scraped sources with
                # gaps - keep confidence honest until a single continuous
                # source covers 12+ months.
                "confidence_level": "Medium" if n_points >= 12 else "Low",
                "data_points": n_points,
                "unit": self.bundle.get("unit", "per-1k-postings"),
                "is_baseline": False,
            }

        # Neutral fallback when the skill was never modeled
        return {
            "skill": skill_name,
            "current_demand_index": None,
            "forecast_next_months": None,
            "projected_growth": None,
            "trend": "Unknown",
            "confidence_level": None,
            "is_baseline": True,
        }

    def get_top_forecasts(self, top_k: int = 10) -> list:
        """Highest projected-demand skills, used by dashboard trend widgets."""
        if not self.bundle:
            return []
        rows = []
        for skill in self.bundle["skills"]:
            f = self.get_skill_forecast(skill)
            if f["projected_demand"] is not None:
                rows.append(f)
        rows.sort(key=lambda r: -r["projected_demand"])
        return rows[:top_k]


forecast_inference = ForecastInference()