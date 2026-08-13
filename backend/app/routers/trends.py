"""Job Trends Router - High Demand Skills, Emerging Roles, Skill Forecasting."""

from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from app.ai.trend_analyzer import job_trend_analyzer
from ml.inference.forecast_inference import forecast_inference

router = APIRouter(tags=["Job Trends & Forecasting"])

@router.get("/api/trends")
async def get_market_trends():
    """Retrieve current high-demand skills, emerging roles, and skill forecasting data."""
    return job_trend_analyzer.analyze_trends()

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
    """Predict future demand indexes for specific software skills."""
    results = {}
    for sk in skills:
        results[sk] = forecast_inference.get_skill_forecast(sk)
    return {
        "status": "SUCCESS",
        "forecasts": results
    }
