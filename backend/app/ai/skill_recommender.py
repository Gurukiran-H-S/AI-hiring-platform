"""
Market-Trending Skill Recommender.

When a candidate's ATS score is below threshold (< 60), recommend the top
market-trending skills that are NOT already present on their resume.
Each recommendation carries a beginner-friendly YouTube search link.

Skills are sourced from the trained Holt-Winters demand forecasting model
(real LinkedIn posting data, retrained monthly); skills not covered by the
model fall back to the static trend-analyzer baseline list.
"""

from typing import Dict, List, Any
from urllib.parse import quote_plus

from ml.inference.forecast_inference import forecast_inference


def _youtube_url(skill: str) -> str:
    return (
        "https://www.youtube.com/results?search_query="
        + quote_plus(f"{skill} full course tutorial for beginners")
    )


# Baseline fallback for skills the forecasting model does not cover yet.
BASELINE_TRENDING = [
    ("Python", "+34%"), ("AWS", "+31%"), ("Docker", "+28%"), ("Kubernetes", "+26%"),
    ("Machine Learning", "+25%"), ("React", "+22%"), ("SQL", "+21%"),
    ("NLP", "+20%"), ("Azure", "+19%"), ("JavaScript", "+18%"),
    ("Deep Learning", "+17%"), ("Data Analysis", "+16%"), ("Linux", "+15%"),
    ("Git", "+14%"), ("REST API", "+14%"), ("Java", "+13%"),
    ("FastAPI", "+33%"), ("TypeScript", "+30%"), ("TensorFlow", "+24%"),
    ("PyTorch", "+27%"), ("Terraform", "+29%"), ("GraphQL", "+23%"),
    ("MongoDB", "+20%"), ("Power BI", "+22%"), ("Spring Boot", "+18%"),
    ("Microservices", "+26%"), ("CI/CD", "+25%"), ("System Design", "+24%"),
    ("Node.js", "+21%"), ("Flutter", "+19%"), ("GoLang", "+28%"),
    ("Cybersecurity", "+32%"), ("Tableau", "+17%"), ("Next.js", "+23%"),
    ("Redis", "+16%"), ("PostgreSQL", "+20%"), ("Kafka", "+25%"),
]


def get_trending_skill_recommendations(
    resume_skills: List[str],
    ats_score: float,
    threshold: float = 60.0,
    count: int = 20,
) -> List[Dict[str, Any]]:
    """Return `count` trending skills absent from the resume, best-first."""
    if ats_score >= threshold:
        return []

    # Case-insensitive exclusion of everything already on the resume.
    owned = {s.strip().lower() for s in (resume_skills or []) if s}

    recommendations: List[Dict[str, Any]] = []

    # 1. Model-backed forecasts first (real posting data, ranked by projected demand)
    for f in forecast_inference.get_top_forecasts(top_k=50):
        if f["skill"].strip().lower() in owned:
            continue
        recommendations.append({
            "skill": f["skill"],
            "projected_demand": f["projected_demand"],
            "growth": f["projected_growth"],
            "trend": f["trend"],
            "confidence": f.get("confidence_level"),
            "youtube_url": _youtube_url(f["skill"]),
            "source": "trained_model",
        })

    # 2. Baseline fill for skills without model coverage
    if len(recommendations) < count:
        for skill, growth in BASELINE_TRENDING:
            if len(recommendations) >= count:
                break
            if skill.strip().lower() in owned:
                continue
            if any(r["skill"] == skill for r in recommendations):
                continue
            recommendations.append({
                "skill": skill,
                "projected_demand": None,
                "growth": growth,
                "trend": "Emerging",
                "confidence": None,
                "youtube_url": _youtube_url(skill),
                "source": "baseline",
            })

    return recommendations[:count]