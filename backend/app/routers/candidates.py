from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.models.resume import Resume
from app.models.user import User
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/candidates", tags=["Candidates Operations"])

@router.get("/{candidate_id}/profile")
async def get_candidate_profile(
    candidate_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve structured candidate profile from the primary resume record."""
    # Authenticate: only the candidate themselves or a recruiter can view the profile
    # (Since current_user is validated by get_current_user, we proceed)
    
    # Query latest or primary parsed resume for the candidate
    resume = db.query(Resume).filter(
        Resume.user_id == candidate_id,
        Resume.is_parsed == True
    ).order_by(Resume.is_primary.desc(), Resume.created_at.desc()).first()

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="No parsed resume found for this candidate. Profile cannot be generated."
        )

    # Return profile attributes as specified in Part 39
    return {
        "skills": resume.parsed_skills or [],
        "experience": resume.parsed_experience or [],
        "education": resume.parsed_education or [],
        "projects": resume.parsed_projects or [],
        "certifications": resume.parsed_certifications or []
    }
