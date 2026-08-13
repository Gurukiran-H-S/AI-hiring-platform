from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.models.resume import Resume
from app.models.user import User
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/nlp", tags=["NLP Debug"])

@router.get("/debug/{resume_id}")
async def nlp_debug_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve internal spaCy, PhraseMatcher and normalization layers for developer review."""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    from ml.preprocessing.skill_normalizer import skill_normalizer
    # Normalize
    raw_skills = resume.parsed_skills or []
    normalized = skill_normalizer.normalize_list(raw_skills)

    return {
        "raw_text": resume.raw_text,
        "sections": {
            "summary": resume.parsed_summary,
            "experience": resume.parsed_experience,
            "education": resume.parsed_education,
            "projects": resume.parsed_projects
        },
        "extracted_skills": raw_skills,
        "normalized_skills": [s["normalized_skill"] for s in normalized],
        "matched_skills": resume.keywords_found or [],
        "missing_skills": resume.keywords_missing or [],
        "partial_skills": [],
        "experience": resume.parsed_experience or [],
        "education": resume.parsed_education or [],
        "projects": resume.parsed_projects or [],
        "confidence": 0.90
    }
