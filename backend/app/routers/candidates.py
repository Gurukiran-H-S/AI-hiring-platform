from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Header
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import base64

from app.database import get_db
from app.models.resume import Resume
from app.models.user import User, CandidateProfile, UserRole
from app.models.coding import CandidateCodingStats, CodingUserProgress, CodingProblem, CandidateSubmission, SubmissionStatus
from app.models.application import Application
from app.middleware.auth_middleware import get_current_user
from app.routers.coding import sync_candidate_coding_stats, get_candidate_coding_rank

router = APIRouter(tags=["Candidate Profile & Operations"])


class CandidateProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    profile_picture_url: Optional[str] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    skills: Optional[List[str]] = None
    education: Optional[List[Dict[str, Any]]] = None
    experience: Optional[List[Dict[str, Any]]] = None
    projects: Optional[List[Dict[str, Any]]] = None
    certifications: Optional[List[Dict[str, Any]]] = None
    preferred_role: Optional[str] = None
    preferred_location: Optional[str] = None
    work_mode: Optional[str] = None
    salary_expectation: Optional[str] = None
    preferred_job_type: Optional[str] = None
    preferred_industries: Optional[List[str]] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    leetcode_url: Optional[str] = None


def calculate_profile_completion(user: User, profile: CandidateProfile, has_resume: bool) -> int:
    """Calculate profile completion % dynamically based on filled sections."""
    score = 0
    # 1. Personal Information (Name, phone, location) = 10%
    has_phone = bool(user.phone)
    has_loc = bool(user.location or profile.preferred_location)
    if user.full_name and has_phone and has_loc:
        score += 10
    elif user.full_name and (has_phone or has_loc):
        score += 7
    elif user.full_name:
        score += 4

    # 2. Professional Summary / Headline = 10%
    if profile.headline and profile.summary:
        score += 10
    elif profile.headline or profile.summary or user.bio:
        score += 6

    # 3. Skills (at least 1) = 15%
    if profile.skills and len(profile.skills) >= 3:
        score += 15
    elif profile.skills and len(profile.skills) > 0:
        score += 10

    # 4. Education (at least 1) = 15%
    if profile.education and len(profile.education) > 0:
        score += 15

    # 5. Experience (at least 1) = 15%
    if profile.experience and len(profile.experience) > 0:
        score += 15
    elif profile.years_of_experience is not None:
        score += 10

    # 6. Projects (at least 1) = 15%
    if profile.projects and len(profile.projects) > 0:
        score += 15

    # 7. Certifications (at least 1) = 5%
    if profile.certifications and len(profile.certifications) > 0:
        score += 5

    # 8. Resume = 10%
    if has_resume:
        score += 10

    # 9. Professional Links = 5%
    if profile.github_url or profile.linkedin_url or profile.portfolio_url or profile.leetcode_url:
        score += 5

    return min(100, score)


def get_or_create_candidate_profile(db: Session, user: User) -> CandidateProfile:
    """Retrieve or initialize candidate profile, populating from parsed resume if empty."""
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # Check if profile skills/education/etc are empty; if so, populate from primary parsed resume
    resume = db.query(Resume).filter(
        Resume.user_id == user.id,
        Resume.is_parsed == True
    ).order_by(Resume.is_primary.desc(), Resume.created_at.desc()).first()

    needs_update = False
    if resume:
        if not profile.skills and resume.parsed_skills:
            profile.skills = resume.parsed_skills
            needs_update = True
        if not profile.education and resume.parsed_education:
            profile.education = resume.parsed_education
            needs_update = True
        if not profile.experience and resume.parsed_experience:
            profile.experience = resume.parsed_experience
            needs_update = True
        if not profile.projects and resume.parsed_projects:
            profile.projects = resume.parsed_projects
            needs_update = True
        if not profile.certifications and resume.parsed_certifications:
            profile.certifications = resume.parsed_certifications
            needs_update = True
        if not profile.summary and resume.parsed_summary:
            profile.summary = resume.parsed_summary
            needs_update = True
        if not user.location and resume.parsed_location:
            user.location = resume.parsed_location
            needs_update = True
        if not user.phone and resume.parsed_phone:
            user.phone = resume.parsed_phone
            needs_update = True

    if needs_update:
        db.commit()
        db.refresh(profile)

    return profile


# ─── 1. CANDIDATE SELF PROFILE (GET & PUT) ──────────────────────────────────

@router.get("/api/candidate/profile")
def get_my_candidate_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve complete candidate profile for the logged in candidate."""
    profile = get_or_create_candidate_profile(db, current_user)
    
    # Query latest or primary resume
    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.is_primary.desc(), Resume.created_at.desc()).first()

    # Dynamic coding statistics
    coding_stats = sync_candidate_coding_stats(db, current_user.id)

    # Dynamic profile completion %
    completion = calculate_profile_completion(current_user, profile, has_resume=bool(resume))
    if profile.profile_completion != completion:
        profile.profile_completion = completion
        db.commit()

    resume_data = None
    if resume:
        resume_data = {
            "id": str(resume.id),
            "file_name": resume.file_name or "Resume.pdf",
            "file_url": resume.file_url,
            "ats_score": round(resume.ats_score, 1) if resume.ats_score is not None else None,
            "uploaded_at": resume.created_at.isoformat() if resume.created_at else None,
            "is_primary": resume.is_primary
        }

    return {
        "id": str(profile.id),
        "user_id": str(current_user.id),
        "name": current_user.full_name,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone or "",
        "location": current_user.location or profile.preferred_location or "",
        "profile_picture_url": current_user.profile_picture_url or "",
        "headline": profile.headline or ("AI/ML Engineer" if "ML" in (profile.skills or []) else "Software Engineer"),
        "summary": profile.summary or current_user.bio or "",
        "skills": profile.skills or [],
        "education": profile.education or [],
        "experience": profile.experience or [],
        "projects": profile.projects or [],
        "certifications": profile.certifications or [],
        "preferred_role": profile.preferred_role or "",
        "preferred_location": profile.preferred_location or "",
        "work_mode": profile.work_mode or "Remote",
        "salary_expectation": profile.salary_expectation or "",
        "preferred_job_type": profile.preferred_job_type or "Full-time",
        "preferred_industries": profile.preferred_industries or [],
        "github_url": profile.github_url or "",
        "linkedin_url": profile.linkedin_url or "",
        "portfolio_url": profile.portfolio_url or "",
        "leetcode_url": profile.leetcode_url or "",
        "resume": resume_data,
        "coding": {
            "problems_solved": coding_stats["problems_solved"],
            "problems_attempted": coding_stats["problems_attempted"],
            "easy_solved": coding_stats["easy_solved"],
            "medium_solved": coding_stats["medium_solved"],
            "hard_solved": coding_stats["hard_solved"],
            "points": coding_stats["total_points"],
            "total_points": coding_stats["total_points"],
            "accuracy": coding_stats["accuracy"],
            "rank": coding_stats["rank"]
        },
        "profile_completion": completion
    }


@router.put("/api/candidate/profile")
def update_my_candidate_profile(
    req: CandidateProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update candidate profile and return updated structure."""
    profile = get_or_create_candidate_profile(db, current_user)

    # Update User model fields
    if req.full_name is not None:
        current_user.full_name = req.full_name
    if req.phone is not None:
        current_user.phone = req.phone
    if req.location is not None:
        current_user.location = req.location
    if req.profile_picture_url is not None:
        current_user.profile_picture_url = req.profile_picture_url
    if req.summary is not None and not current_user.bio:
        current_user.bio = req.summary

    # Update CandidateProfile model fields
    if req.headline is not None:
        profile.headline = req.headline
    if req.summary is not None:
        profile.summary = req.summary
    if req.skills is not None:
        profile.skills = req.skills
    if req.education is not None:
        profile.education = req.education
    if req.experience is not None:
        profile.experience = req.experience
    if req.projects is not None:
        profile.projects = req.projects
    if req.certifications is not None:
        profile.certifications = req.certifications
    if req.preferred_role is not None:
        profile.preferred_role = req.preferred_role
    if req.preferred_location is not None:
        profile.preferred_location = req.preferred_location
    if req.work_mode is not None:
        profile.work_mode = req.work_mode
    if req.salary_expectation is not None:
        profile.salary_expectation = req.salary_expectation
    if req.preferred_job_type is not None:
        profile.preferred_job_type = req.preferred_job_type
    if req.preferred_industries is not None:
        profile.preferred_industries = req.preferred_industries
    if req.github_url is not None:
        profile.github_url = req.github_url
    if req.linkedin_url is not None:
        profile.linkedin_url = req.linkedin_url
    if req.portfolio_url is not None:
        profile.portfolio_url = req.portfolio_url
    if req.leetcode_url is not None:
        profile.leetcode_url = req.leetcode_url

    resume_exists = db.query(Resume).filter(Resume.user_id == current_user.id).first() is not None
    completion = calculate_profile_completion(current_user, profile, has_resume=resume_exists)
    profile.profile_completion = completion
    profile.updated_at = datetime.utcnow()
    current_user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(profile)
    db.refresh(current_user)

    return get_my_candidate_profile(current_user=current_user, db=db)


@router.post("/api/candidate/profile/picture")
async def upload_candidate_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and set candidate profile picture (supports JPEG, PNG, WEBP, GIF up to 5MB)."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files (JPEG, PNG, WEBP, GIF) are allowed.")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image file too large. Maximum size is 5MB.")

    # Convert to base64 Data URL for zero-dependency portability and instant persistence
    encoded = base64.b64encode(contents).decode("utf-8")
    data_url = f"data:{file.content_type};base64,{encoded}"

    current_user.profile_picture_url = data_url
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile picture updated successfully!",
        "profile_picture_url": data_url
    }


@router.delete("/api/candidate/profile/picture")
def delete_candidate_profile_picture(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove candidate profile picture."""
    current_user.profile_picture_url = None
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile picture removed successfully.",
        "profile_picture_url": ""
    }


# ─── 2. CANDIDATE CODING PROGRESS ENDPOINT ─────────────────────────────────

@router.get("/api/candidates/{candidate_id}/coding-progress")
def get_candidate_coding_progress_endpoint(
    candidate_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve coding progress metrics for any candidate (Recruiter / Candidate view)."""
    cand = db.query(User).filter(User.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    stats_data = sync_candidate_coding_stats(db, candidate_id)
    return {
        "candidate_id": str(candidate_id),
        "problems_solved": stats_data["problems_solved"],
        "problems_attempted": stats_data["problems_attempted"],
        "easy_solved": stats_data["easy_solved"],
        "medium_solved": stats_data["medium_solved"],
        "hard_solved": stats_data["hard_solved"],
        "total_points": stats_data["total_points"],
        "accuracy": stats_data["accuracy"],
        "rank": stats_data["rank"]
    }


# ─── 3. RECRUITER CANDIDATE PROFILE ENDPOINT ───────────────────────────────

@router.get("/api/candidates/{candidate_id}/profile")
def get_candidate_full_profile_for_recruiter(
    candidate_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve comprehensive candidate profile for recruiter view (safe, non-sensitive)."""
    cand = db.query(User).filter(User.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    profile = get_or_create_candidate_profile(db, cand)
    resume = db.query(Resume).filter(
        Resume.user_id == candidate_id
    ).order_by(Resume.is_primary.desc(), Resume.created_at.desc()).first()

    coding_stats = sync_candidate_coding_stats(db, candidate_id)

    # Resume data safe for recruiter
    resume_data = None
    if resume:
        resume_data = {
            "id": str(resume.id),
            "file_name": resume.file_name or "Resume.pdf",
            "file_url": resume.file_url,
            "ats_score": round(resume.ats_score, 1) if resume.ats_score is not None else 0.0,
            "uploaded_at": resume.created_at.isoformat() if resume.created_at else None
        }

    return {
        "candidate_id": str(cand.id),
        "name": cand.full_name,
        "full_name": cand.full_name,
        "email": cand.email,
        "location": cand.location or profile.preferred_location or (resume.parsed_location if resume else "Remote"),
        "headline": profile.headline or "Software Engineer",
        "summary": profile.summary or cand.bio or (resume.parsed_summary if resume else ""),
        "skills": profile.skills or (resume.parsed_skills if resume else []),
        "education": profile.education or (resume.parsed_education if resume else []),
        "experience": profile.experience or (resume.parsed_experience if resume else []),
        "projects": profile.projects or (resume.parsed_projects if resume else []),
        "certifications": profile.certifications or (resume.parsed_certifications if resume else []),
        "resume": resume_data,
        "ats_score": round(resume.ats_score, 1) if resume and resume.ats_score is not None else 0.0,
        "coding": {
            "problems_solved": coding_stats["problems_solved"],
            "problems_attempted": coding_stats["problems_attempted"],
            "easy_solved": coding_stats["easy_solved"],
            "medium_solved": coding_stats["medium_solved"],
            "hard_solved": coding_stats["hard_solved"],
            "total_points": coding_stats["total_points"],
            "points": coding_stats["total_points"],
            "accuracy": coding_stats["accuracy"],
            "rank": coding_stats["rank"]
        },
        "links": {
            "github_url": profile.github_url or "",
            "linkedin_url": profile.linkedin_url or "",
            "portfolio_url": profile.portfolio_url or "",
            "leetcode_url": profile.leetcode_url or ""
        }
    }


# ─── 4. CANDIDATE 360° LIVE PROFILE (Public / QR Accessible) ───────────────

@router.get("/api/candidates/{candidate_id}/360")
@router.get("/candidates/{candidate_id}/360")
def get_candidate_360_profile(
    candidate_id: str,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Retrieve full Candidate 360° evaluation profile with exact database records."""
    from app.models.user import UserRole
    from app.utils.jwt_handler import decode_token
    from app.models.aptitude import AssessmentAttempt
    import uuid

    cand = None
    cand_uuid = None

    # 1. If candidate_id is 'me' or if token provided and candidate_id is generic
    if candidate_id in ("me", "my-profile", "current", "verified", "undefined", "null") and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = decode_token(token)
            user_id = payload.get("sub")
            if user_id:
                cand = db.query(User).filter(User.id == uuid.UUID(str(user_id))).first()
        except Exception:
            pass

    # 2. Try parsing as UUID
    if not cand:
        try:
            cand_uuid = uuid.UUID(str(candidate_id))
        except (ValueError, AttributeError):
            cand_uuid = None

        if cand_uuid:
            # Try direct User.id
            cand = db.query(User).filter(User.id == cand_uuid).first()
            if not cand:
                # Try CandidateProfile.id
                prof = db.query(CandidateProfile).filter(CandidateProfile.id == cand_uuid).first()
                if prof and prof.user_id:
                    cand = db.query(User).filter(User.id == prof.user_id).first()
            if not cand:
                # Try CandidateProfile.user_id
                prof = db.query(CandidateProfile).filter(CandidateProfile.user_id == cand_uuid).first()
                if prof:
                    cand = db.query(User).filter(User.id == cand_uuid).first()

    # 3. Try by email or username if not found
    if not cand and candidate_id and candidate_id not in ("undefined", "null", "none", "me", "verified"):
        cand = db.query(User).filter(User.email.ilike(candidate_id)).first()
        if not cand:
            cand = db.query(User).filter(User.full_name.ilike(candidate_id)).first()

    # 4. If token is present, fallback to the logged-in user
    if not cand and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = decode_access_token(token)
            user_id = payload.get("sub")
            if user_id:
                cand = db.query(User).filter(User.id == uuid.UUID(str(user_id))).first()
        except Exception:
            pass

    # 5. If still not found, return 404
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate profile not found.")

    profile = get_or_create_candidate_profile(db, cand)
    resume = db.query(Resume).filter(
        Resume.user_id == cand.id
    ).order_by(Resume.is_primary.desc(), Resume.created_at.desc()).first()

    coding_stats = sync_candidate_coding_stats(db, cand.id)

    attempts = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.candidate_id == cand.id,
        AssessmentAttempt.is_submitted == True
    ).all()
    avg_aptitude = round(sum(a.score or 0 for a in attempts) / max(1, len(attempts)), 1) if attempts else None

    resume_data = None
    if resume:
        resume_data = {
            "id": str(resume.id),
            "file_name": resume.file_name or "Resume.pdf",
            "file_url": resume.file_url,
            "ats_score": round(resume.ats_score, 1) if resume.ats_score is not None else 0.0,
            "uploaded_at": resume.created_at.isoformat() if resume.created_at else None
        }

    return {
        "candidate_id": str(cand.id),
        "name": profile.name or cand.full_name or "Candidate",
        "full_name": profile.name or cand.full_name or "Candidate",
        "email": cand.email,
        "phone": cand.phone or (profile.phone if hasattr(profile, "phone") else "") or (resume.parsed_phone if resume else "") or "",
        "location": profile.preferred_location or cand.location or (resume.parsed_location if resume else "") or "",
        "headline": profile.headline or ("Software Developer" if not profile.skills else f"{profile.skills[0]} Developer"),
        "summary": profile.summary or cand.bio or (resume.parsed_summary if resume else "") or "",
        "bio": profile.summary or cand.bio or "",
        "experience_years": profile.years_of_experience or "",
        "profile_picture": profile.profile_picture_url or cand.profile_picture_url or cand.avatar_url or "",
        "skills": profile.skills or (resume.parsed_skills if resume else []),
        "education": profile.education or (resume.parsed_education if resume else []),
        "experience": profile.experience or (resume.parsed_experience if resume else []),
        "projects": profile.projects or (resume.parsed_projects if resume else []),
        "certifications": profile.certifications or (resume.parsed_certifications if resume else []),
        "resume": resume_data,
        "ats_score": round(resume.ats_score, 1) if resume and resume.ats_score is not None else 0.0,
        "coding": {
            "problems_solved": coding_stats["problems_solved"],
            "problems_attempted": coding_stats["problems_attempted"],
            "easy_solved": coding_stats["easy_solved"],
            "medium_solved": coding_stats["medium_solved"],
            "hard_solved": coding_stats["hard_solved"],
            "total_points": coding_stats["total_points"],
            "points": coding_stats["total_points"],
            "accuracy": coding_stats["accuracy"],
            "rank": coding_stats["rank"]
        },
        "aptitude": {
            "assessments_completed": len(attempts),
            "average_score": avg_aptitude
        },
        "links": {
            "github_url": profile.github_url or "",
            "linkedin_url": profile.linkedin_url or "",
            "portfolio_url": profile.portfolio_url or "",
            "leetcode_url": profile.leetcode_url or ""
        },
        "verified": True
    }
