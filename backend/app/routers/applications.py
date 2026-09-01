"""Applications router - Tracker, Timeline Activities, Status Updates, Saved Jobs."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.application import Application, ApplicationStatus
from app.models.user import User, UserRole
from app.models.job import Job
from app.middleware.auth_middleware import get_current_user, get_current_candidate

router = APIRouter(prefix="/api/applications", tags=["Applications"])


class ExternalApplicationCreate(BaseModel):
    job_title: str
    company: str
    job_id: Optional[UUID] = None
    application_url: Optional[str] = None
    notes: Optional[str] = "Applied via external provider link"
    source: Optional[str] = "External"
    source_job_id: Optional[str] = None


class StatusUpdateRequest(BaseModel):
    status: str
    notes: Optional[str] = None


class OfferResponseRequest(BaseModel):
    response: str = "accepted"  # accepted | declined
    signature: Optional[str] = None


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

        from app.models.interview import Interview, InterviewStatus
        all_interviews = db.query(Interview).filter(
            (Interview.application_id == app.id) |
            ((Interview.candidate_id == app.candidate_id) & (Interview.job_id == app.job_id))
        ).order_by(Interview.scheduled_at.desc()).all()

        meeting_logs = []
        for iv in all_interviews:
            iv_st = iv.status.value if hasattr(iv.status, 'value') else str(iv.status).lower()
            iv_tp = iv.interview_type.value if hasattr(iv.interview_type, 'value') else str(iv.interview_type)
            meeting_logs.append({
                "id": str(iv.id),
                "title": iv.title or f"{iv_tp.title()} Interview",
                "interview_type": iv_tp,
                "status": iv_st,
                "scheduled_at": iv.scheduled_at.strftime("%d %b %Y at %I:%M %p") if iv.scheduled_at else "N/A",
                "duration_minutes": iv.duration_minutes or 45,
                "meeting_link": iv.meeting_link if iv_st != "cancelled" else None,
                "location": iv.location or "Online",
                "notes": iv.notes,
            })

        latest_interview = all_interviews[0] if all_interviews else None
        meeting_link = None
        scheduled_at = None
        interview_type = None
        interview_status = None

        if latest_interview:
            interview_status = latest_interview.status.value if hasattr(latest_interview.status, 'value') else str(latest_interview.status).lower()
            scheduled_at = latest_interview.scheduled_at.strftime("%d %b %Y at %I:%M %p") if latest_interview.scheduled_at else None
            interview_type = latest_interview.interview_type.value if hasattr(latest_interview.interview_type, 'value') else str(latest_interview.interview_type)
            if latest_interview.status != InterviewStatus.CANCELLED and app.status.value in ["interview", "interview_scheduled"]:
                meeting_link = latest_interview.meeting_link
            else:
                meeting_link = None
        elif app.status.value in ["interview", "interview_scheduled"]:
            meeting_link = "https://meet.jit.si/hireai-interview"
            interview_type = "technical"
            interview_status = "scheduled"

        from app.models.application import OfferLetter
        offer = db.query(OfferLetter).filter(
            (OfferLetter.application_id == app.id) |
            ((OfferLetter.candidate_id == app.candidate_id) & (OfferLetter.job_id == app.job_id))
        ).order_by(OfferLetter.sent_at.desc()).first()

        offer_letter_data = None
        if offer:
            offer_letter_data = {
                "id": str(offer.id),
                "job_title": offer.job_title,
                "company_name": offer.company_name,
                "salary_offered": offer.salary_offered,
                "joining_date": offer.joining_date,
                "department": offer.department,
                "location_type": offer.location_type,
                "benefits": offer.benefits,
                "letter_body": offer.letter_body,
                "status": offer.status,
                "sent_at": offer.sent_at.strftime("%d %b %Y at %I:%M %p") if offer.sent_at else None,
                "responded_at": offer.responded_at.strftime("%d %b %Y") if offer.responded_at else None,
                "candidate_signature": offer.candidate_signature
            }

        # Build comprehensive activity timeline
        timeline = [
            {"date": app.applied_at.strftime("%d %b") if app.applied_at else "Today", "event": "Application submitted"}
        ]
        if app.is_shortlisted or app.status.value in ["shortlisted", "interview_scheduled", "interview", "offered", "hired"]:
            timeline.append({"date": "Shortlist", "event": "Candidate shortlisted for evaluation"})

        for m in meeting_logs:
            if m["status"] == "cancelled":
                timeline.append({"date": "Log", "event": f"Interview meeting cancelled ({m['scheduled_at']})"})
            elif m["status"] == "rescheduled":
                timeline.append({"date": "Log", "event": f"Interview rescheduled to {m['scheduled_at']}"})
            elif m["status"] in ["scheduled", "confirmed"]:
                timeline.append({"date": "Log", "event": f"Interview scheduled for {m['scheduled_at']}"})

        if offer_letter_data:
            timeline.append({"date": "Offer", "event": f"Official Offer Letter Extended ({offer_letter_data['salary_offered']})"})
            if offer_letter_data["status"] == "accepted":
                timeline.append({"date": "Hired", "event": "Offer Letter Accepted by Candidate 🎉"})

        timeline.append({"date": "Current", "event": f"Status: {app.status.value.replace('_', ' ').title()}"})

        results.append({
            "id": str(app.id),
            "job_id": str(app.job_id) if app.job_id else None,
            "job_title": job_title,
            "title": job_title,
            "company": company,
            "status": app.status.value,
            "applied_at": app.applied_at.strftime("%d %b %Y") if app.applied_at else "Recently",
            "updated_at": app.updated_at.strftime("%d %b %Y") if app.updated_at else None,
            "ats_score": app.ats_score or 78.0,
            "overall_score": app.overall_score or 82.0,
            "recruiter_notes": app.recruiter_notes,
            "meeting_link": meeting_link,
            "scheduled_at": scheduled_at,
            "interview_type": interview_type,
            "interview_status": interview_status,
            "meeting_logs": meeting_logs,
            "offer_letter": offer_letter_data,
            "timeline": timeline
        })

    return results


@router.post("/{app_id}/offer-letter/respond")
async def respond_to_offer_letter(
    app_id: UUID,
    req: OfferResponseRequest,
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db),
):
    """Candidate accepts or declines an extended offer letter."""
    from app.models.application import OfferLetter, Application, ApplicationStatus
    from app.models.notification import Notification, NotificationType

    app = db.query(Application).filter(
        Application.id == app_id,
        Application.candidate_id == current_user.id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    offer = db.query(OfferLetter).filter(OfferLetter.application_id == app_id).order_by(OfferLetter.sent_at.desc()).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer letter not found.")

    if req.response.lower() == "accepted":
        offer.status = "accepted"
        offer.responded_at = datetime.utcnow()
        offer.candidate_signature = req.signature or current_user.full_name
        app.status = ApplicationStatus.HIRED
        app.recruiter_notes = f"Candidate accepted offer letter on {datetime.utcnow().strftime('%d %b %Y')}."

        # Notify recruiter
        notif = Notification(
            user_id=offer.recruiter_id,
            type=NotificationType.APPLICATION_STATUS,
            title="🎉 Offer Letter Accepted by Candidate!",
            message=f"{current_user.full_name} has accepted the offer letter for {offer.job_title}! Ready for onboarding.",
            link="/recruiter/candidates"
        )
        db.add(notif)
    else:
        offer.status = "declined"
        offer.responded_at = datetime.utcnow()
        app.status = ApplicationStatus.WITHDRAWN
        app.recruiter_notes = f"Candidate declined offer letter on {datetime.utcnow().strftime('%d %b %Y')}."

        notif = Notification(
            user_id=offer.recruiter_id,
            type=NotificationType.APPLICATION_STATUS,
            title="Offer Letter Declined",
            message=f"{current_user.full_name} has declined the offer letter for {offer.job_title}.",
            link="/recruiter/candidates"
        )
        db.add(notif)

    db.commit()
    return {"message": f"Offer letter {offer.status} successfully.", "status": offer.status}


@router.post("/track-external")
async def track_external_application(
    req: ExternalApplicationCreate,
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db),
):
    """Create application record when candidate confirms external job application."""
    from app.models.resume import Resume

    target_job = None
    if req.job_id:
        target_job = db.query(Job).filter(Job.id == req.job_id).first()
    elif req.source_job_id:
        try:
            target_job = db.query(Job).filter(Job.id == UUID(req.source_job_id)).first()
        except Exception:
            target_job = db.query(Job).filter(Job.title.ilike(req.job_title), Job.company.ilike(req.company)).first()
    elif req.job_title and req.company:
        target_job = db.query(Job).filter(Job.title.ilike(req.job_title), Job.company.ilike(req.company)).first()

    if not target_job:
        recruiter = db.query(User).filter(User.role == UserRole.RECRUITER).first()
        recruiter_id = recruiter.id if recruiter else current_user.id
        target_job = Job(
            recruiter_id=recruiter_id,
            title=req.job_title,
            company=req.company,
            description=f"External job application for {req.job_title} at {req.company}.",
            status=JobStatus.DRAFT,
            is_demo=False
        )
        db.add(target_job)
        db.commit()
        db.refresh(target_job)

    job_id = target_job.id

    # Check for existing application
    if job_id:
        existing = db.query(Application).filter(
            Application.candidate_id == current_user.id,
            Application.job_id == job_id,
        ).first()
        if existing:
            return {
                "message": f"Already tracking application for {req.job_title} at {req.company}!",
                "application_id": str(existing.id),
                "status": existing.status.value,
            }

    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id,
        Resume.is_parsed == True
    ).order_by(Resume.created_at.desc()).first()

    app = Application(
        candidate_id=current_user.id,
        job_id=job_id,
        resume_id=resume.id if resume else None,
        ats_score=resume.ats_score if resume else 75.0,
        status=ApplicationStatus.APPLIED,
        recruiter_notes=f"Application: {req.notes} ({req.company})",
        applied_at=datetime.utcnow(),
    )
    db.add(app)
    if target_job:
        target_job.total_applications = (target_job.total_applications or 0) + 1
    db.commit()
    db.refresh(app)

    if target_job:
        from app.services import evaluation_engine
        from app.routers.recruiter import _persist_candidate_score
        from app.routers.coding import sync_candidate_coding_stats

        sync_candidate_coding_stats(db, current_user.id)
        ev = evaluation_engine.evaluate_application(db, app, target_job)
        _persist_candidate_score(db, ev, target_job.id)
        db.commit()

    return {
        "message": f"Successfully applied and tracking application for {req.job_title} at {req.company}!",
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

    if current_user.role == UserRole.CANDIDATE:
        if str(app.candidate_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to update this application.")
    elif current_user.role == UserRole.RECRUITER:
        job = db.query(Job).filter(Job.id == app.job_id, Job.recruiter_id == current_user.id).first()
        if not job:
            raise HTTPException(status_code=403, detail="Not authorized to update an application for another recruiter's job.")

    try:
        new_status = ApplicationStatus(req.status.lower())
        app.status = new_status
        if req.notes:
            app.recruiter_notes = req.notes
        elif new_status != ApplicationStatus.REJECTED:
            app.recruiter_notes = f"Status updated to {new_status.value.replace('_', ' ').title()}"
        app.updated_at = datetime.utcnow()
        db.commit()
        return {"message": f"Application status updated to {new_status.value}", "status": new_status.value}
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {req.status}")


@router.delete("/{app_id}")
async def delete_application(
    app_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an application record cleanly."""
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if current_user.role == UserRole.CANDIDATE and str(app.candidate_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this application")
    elif current_user.role == UserRole.RECRUITER:
        job = db.query(Job).filter(Job.id == app.job_id, Job.recruiter_id == current_user.id).first()
        if not job:
            raise HTTPException(status_code=403, detail="Not authorized to delete an application for another recruiter's job.")

    try:
        from app.models.interview import Interview
        db.query(Interview).filter(Interview.application_id == app.id).delete(synchronize_session=False)

        db.delete(app)
        db.commit()
        return {"message": "Application deleted successfully", "id": str(app_id)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete application: {str(e)}")
