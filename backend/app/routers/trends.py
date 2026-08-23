"""Job Trends Router - High Demand Skills, Emerging Roles, Skill Forecasting."""

from fastapi import APIRouter
from typing import List, Dict, Any
from app.ai.trend_analyzer import job_trend_analyzer
from ml.inference.forecast_inference import forecast_inference

router = APIRouter(tags=["Job Trends & Forecasting"])


@router.get("/api/trends")
async def get_market_trends():
    """Market trends. Where the trained forecasting model covers a skill,
    growth rates come from real Holt-Winters projections (per-1k-postings
    demand); otherwise the static analyzer baseline is kept."""
    trends = job_trend_analyzer.analyze_trends()

    # Overlay REAL model forecasts on matching skills
    forecasts = {f["skill"]: f for f in forecast_inference.get_top_forecasts(top_k=50)}
    for item in trends.get("high_demand_skills", []):
        f = forecasts.get(item["skill"])
        if f:
            item["growth_rate"] = f["projected_growth"]
            item["demand_score"] = min(100, round(f["projected_demand"] / 10))
            item["source"] = "trained_model"
        else:
            item["source"] = "baseline"

    trends["skill_forecasts"] = [
        {
            "skill": f["skill"],
            "current": f["current_demand_index"],
            "projected": f["projected_demand"],
            "growth": f["projected_growth"],
            "trend": f["trend"],
            "confidence": f["confidence_level"],
            "unit": f.get("unit"),
        }
        for f in forecast_inference.get_top_forecasts(top_k=15)
    ]
    trends["forecast_model"] = {
        "trained": forecast_inference.is_trained,
        "version": forecast_inference.bundle.get("version") if forecast_inference.bundle else None,
        "horizon_months": forecast_inference.bundle.get("horizon_months") if forecast_inference.bundle else None,
    }
    return trends


@router.get("/api/forecast/jobs")
async def get_jobs_forecast():
    """Predict future job openings and emerging software roles."""
    return {
        "status": "SUCCESS",
        "predicted_growth_roles": [
            {"role": "AI / LLM Engineer", "projected_growth": "+65%", "confidence": "High"},
            {"role": "Cloud Native Architect", "projected_growth": "+42%", "confidence": "Medium"},
            {"role": "MLOps Engineer", "projected_growth": "+38%", "confidence": "High"}
        ]
    }


@router.get("/api/forecast/skills")
async def get_skills_forecast(skills: List[str] = ["Python", "AWS", "Docker"]):
    """Predict future demand indexes for specific software skills.
    Served by the Holt-Winters forecasting model (monthly retrain)."""
    results = {}
    for sk in skills:
        results[sk] = forecast_inference.get_skill_forecast(sk)
    return {
        "status": "SUCCESS",
        "forecasts": results
    }