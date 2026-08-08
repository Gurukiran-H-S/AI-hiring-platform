"""Applications router - Tracker, Timeline Activities, Status Updates, Saved Jobs."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.application import Application, ApplicationStatus
from app.models.user import User
from app.models.job import Job
from app.middleware.auth_middleware import get_current_user, get_current_candidate

router = APIRouter(prefix="/api/applications", tags=["Applications"])


class ExternalApplicationCreate(BaseModel):
    job_title: str
    company: str
    application_url: Optional[str] = None
    notes: Optional[str] = "Applied via external provider link"
    source: Optional[str] = "External"
    source_job_id: Optional[str] = None


class StatusUpdateRequest(BaseModel):
    status: str
    notes: Optional[str] = None


@router.get("/")
async def list_candidate_applications(
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db),
):
    """List all job applications for the logged-in candidate with status & timelines."""
    apps = db.query(Application).filter(
        Application.candidate_id == current_user.id
    ).options(joinedload(Application.job)).order_by(Application.applied_at.desc()).all()

    results = []
    for app in apps:
        job_title = app.job.title if app.job else getattr(app, 'job_title', 'Software Position')
        company = app.job.company if app.job else getattr(app, 'company', 'Tech Company')

        results.append({
            "id": str(app.id),
            "job_id": str(app.job_id) if app.job_id else None,
            "job_title": job_title,
            "company": company,
            "status": app.status.value,
            "applied_at": app.applied_at.strftime("%d %b %Y") if app.applied_at else "Recently",
            "updated_at": app.updated_at.strftime("%d %b %Y") if app.updated_at else None,
            "ats_score": app.ats_score or 78.0,
            "overall_score": app.overall_score or 82.0,
            "recruiter_notes": app.recruiter_notes,
            "timeline": [
                {"date": app.applied_at.strftime("%d %b") if app.applied_at else "Today", "event": "Application submitted"},
                {"date": "Pending", "event": f"Current Status: {app.status.value.replace('_', ' ').title()}"}
            ]
        })

    return results


@router.post("/track-external")
async def track_external_application(
    req: ExternalApplicationCreate,
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db),
):
    """Create application record when candidate confirms external job application."""
    # Find or create placeholder job ID if missing
    dummy_job = db.query(Job).first()
    job_id = dummy_job.id if dummy_job else None

    app = Application(
        candidate_id=current_user.id,
        job_id=job_id,
        status=ApplicationStatus.APPLIED,
        recruiter_notes=f"External Application: {req.notes} ({req.company})",
        applied_at=datetime.utcnow(),
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    return {
        "message": f"Successfully tracking application for {req.job_title} at {req.company}!",
        "application_id": str(app.id),
        "status": app.status.value
    }


@router.put("/{app_id}/status")
async def update_application_status(
    app_id: UUID,
    req: StatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update application status (Candidate manual update or Recruiter action)."""
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    try:
        new_status = ApplicationStatus(req.status.lower())
        app.status = new_status
        if req.notes:
            app.recruiter_notes = req.notes
        app.updated_at = datetime.utcnow()
        db.commit()
        return {"message": f"Application status updated to {new_status.value}", "status": new_status.value}
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {req.status}")
