"""Notifications and Interviews routers."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.models.notification import Notification, NotificationType
from app.models.interview import Interview, InterviewStatus
from app.models.user import User
from app.middleware.auth_middleware import get_current_user, get_current_recruiter

# ─── Notifications ────────────────────────────────────────────────────────────
notif_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@notif_router.get("/")
async def list_notifications(
    is_read: Optional[bool] = Query(None),
    limit: int = Query(20, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get notifications for the current user."""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).count()
    return {
        "unread_count": unread_count,
        "notifications": [
            {
                "id": str(n.id),
                "type": n.type.value,
                "title": n.title,
                "message": n.message,
                "link": n.link,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat(),
            }
            for n in notifications
        ],
    }


@notif_router.put("/{notif_id}/read")
async def mark_read(
    notif_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    notif.read_at = datetime.utcnow()
    db.commit()
    return {"status": "marked as read"}


@notif_router.put("/mark-all-read")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all notifications as read."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True, "read_at": datetime.utcnow()})
    db.commit()
    return {"status": "all marked as read"}


# ─── Interviews ───────────────────────────────────────────────────────────────
interview_router = APIRouter(prefix="/api/interviews", tags=["Interviews"])


class InterviewCreate:
    def __init__(self):
        pass


@interview_router.post("/schedule")
async def schedule_interview(
    application_id: UUID,
    job_id: UUID,
    candidate_id: UUID,
    scheduled_at: datetime,
    interview_type: str = "video",
    duration_minutes: int = 60,
    meeting_link: Optional[str] = None,
    location: Optional[str] = None,
    title: Optional[str] = "Interview Round 1",
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Schedule an interview."""
    interview = Interview(
        application_id=application_id,
        job_id=job_id,
        candidate_id=candidate_id,
        recruiter_id=current_user.id,
        interview_type=interview_type,
        scheduled_at=scheduled_at,
        duration_minutes=duration_minutes,
        meeting_link=meeting_link,
        location=location,
        title=title,
    )
    db.add(interview)

    # Update application status
    from app.models.application import Application, ApplicationStatus
    app = db.query(Application).filter(Application.id == application_id).first()
    if app:
        app.status = ApplicationStatus.INTERVIEW_SCHEDULED

    # Create notification for candidate
    notif = Notification(
        user_id=candidate_id,
        type=NotificationType.INTERVIEW_SCHEDULED,
        title="Interview Scheduled! 🎯",
        message=f"You have an interview scheduled for {scheduled_at.strftime('%B %d, %Y at %I:%M %p')}",
        link=f"/candidate/interviews",
    )
    db.add(notif)
    db.commit()
    db.refresh(interview)

    return {"interview_id": str(interview.id), "status": "scheduled", "scheduled_at": scheduled_at.isoformat()}


@interview_router.get("/")
async def list_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List interviews for current user with job and company metadata."""
    from app.models.user import UserRole
    from app.models.job import Job
    if current_user.role == UserRole.CANDIDATE:
        interviews = db.query(Interview).filter(Interview.candidate_id == current_user.id).order_by(Interview.scheduled_at.desc()).all()
    else:
        interviews = db.query(Interview).filter(Interview.recruiter_id == current_user.id).order_by(Interview.scheduled_at.desc()).all()

    result = []
    for i in interviews:
        job = db.query(Job).filter(Job.id == i.job_id).first() if i.job_id else None
        recruiter = db.query(User).filter(User.id == i.recruiter_id).first() if i.recruiter_id else None
        candidate = db.query(User).filter(User.id == i.candidate_id).first() if i.candidate_id else None
        result.append({
            "id": str(i.id),
            "title": i.title or f"{i.interview_type.value.capitalize()} Interview",
            "job_id": str(i.job_id) if i.job_id else None,
            "job_title": job.title if job else "Applied Position",
            "company_name": job.company if job else "Hiring Team",
            "recruiter_name": recruiter.full_name if recruiter else "Hiring Recruiter",
            "candidate_name": candidate.full_name if candidate else "Candidate",
            "interview_type": i.interview_type.value if hasattr(i.interview_type, 'value') else str(i.interview_type),
            "status": i.status.value if hasattr(i.status, 'value') else str(i.status),
            "scheduled_at": i.scheduled_at.isoformat() if i.scheduled_at else None,
            "duration_minutes": i.duration_minutes or 45,
            "meeting_link": i.meeting_link or "https://meet.jit.si/hireai-interview",
            "location": i.location or "Online",
            "notes": i.notes or "",
        })
    return result


@interview_router.put("/{interview_id}/status")
async def update_interview_status(
    interview_id: UUID,
    new_status: str,
    feedback: Optional[str] = None,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Update interview status."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    interview.status = InterviewStatus(new_status)
    if feedback:
        interview.recruiter_feedback = feedback
    interview.updated_at = datetime.utcnow()
    db.commit()

    return {"status": "updated", "new_status": new_status}
