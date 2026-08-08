"""Job Trends Router - High Demand Skills, Emerging Roles, Skill Forecasting."""

from fastapi import APIRouter
from app.ai.trend_analyzer import job_trend_analyzer

router = APIRouter(prefix="/api/trends", tags=["Job Trends"])

@router.get("/")
async def get_market_trends():
    """Retrieve current high-demand skills, emerging roles, and skill forecasting data."""
    return job_trend_analyzer.analyze_trends()
