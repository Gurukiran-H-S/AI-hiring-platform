from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.job import Job, JobStatus, JobType, ExperienceLevel
from app.models.user import User, CandidateProfile, UserRole
from app.models.resume import Resume
from app.models.application import Application, ApplicationStatus
from app.models.interview import Interview, InterviewStatus, InterviewType
from app.models.notification import Notification, NotificationType
from app.models.evaluation import EvaluationWeight, CandidateScore, CandidateSkillEvaluation
from app.middleware.auth_middleware import get_current_recruiter
from app.ai.semantic_matcher import semantic_matcher
from app.services.candidate_scoring_service import candidate_scoring_service

router = APIRouter(prefix="/api/recruiter", tags=["Recruiter Operations"])


# ─── Pydantic Request Schemas ──────────────────────────────────────────────

class JobCreateSchema(BaseModel):
    title: str = Field(..., min_length=2)
    company: str = Field(..., min_length=2)
    description: str = Field(..., min_length=10)
    required_skills: List[str] = Field(..., min_items=1)
    preferred_skills: Optional[List[str]] = []
    min_experience_years: int = Field(0, ge=0)
    max_experience_years: Optional[int] = Field(5, ge=0)
    required_education: Optional[str] = "Bachelor's Degree"
    location: str = Field(..., min_length=2)
    job_type: str = "Full-time"
    is_remote: bool = False
    salary_min: Optional[int] = 500000
    salary_max: Optional[int] = 1200000


class EvaluationWeightUpdateSchema(BaseModel):
    ats_weight: float = Field(..., ge=0.0, le=1.0)
    coding_weight: float = Field(..., ge=0.0, le=1.0)
    skill_weight: float = Field(..., ge=0.0, le=1.0)
    interview_weight: float = Field(..., ge=0.0, le=1.0)


class ShortlistRequest(BaseModel):
    candidate_id: UUID
    job_id: UUID


class RejectRequest(BaseModel):
    candidate_id: UUID
    job_id: UUID
    reason: Optional[str] = "Skills mismatch"


class ScheduleInterviewRequest(BaseModel):
    candidate_id: UUID
    job_id: UUID
    interview_type: str = "Technical"
    scheduled_at: datetime
    duration_minutes: int = 45
    meeting_link: Optional[str] = "https://meet.jit.si/hireai-interview"
    location: Optional[str] = "Online"
    notes: Optional[str] = "Technical Round"


class CompareRequest(BaseModel):
    candidate_ids: List[UUID]


# ─── 1. POST A NEW JOB ──────────────────────────────────────────────────────

@router.post("/jobs", status_code=201)
async def create_new_job(
    req: JobCreateSchema,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Create a new job posting with default evaluation weights."""
    try:
        j_type = JobType(req.job_type)
    except ValueError:
        j_type = JobType.FULL_TIME

    job = Job(
        recruiter_id=current_user.id,
        title=req.title,
        company=req.company,
        description=req.description,
        required_skills=req.required_skills,
        preferred_skills=req.preferred_skills,
        min_experience_years=req.min_experience_years,
        max_experience_years=req.max_experience_years,
        required_education=req.required_education,
        location=req.location,
        job_type=j_type,
        is_remote=req.is_remote,
        salary_min=req.salary_min,
        salary_max=req.salary_max,
        status=JobStatus.ACTIVE,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Initialize default weights for job (30% ATS, 40% Coding, 20% Skill Match, 10% Interview)
    weights = EvaluationWeight(
        job_id=job.id,
        ats_weight=0.30,
        coding_weight=0.40,
        skill_weight=0.20,
        interview_weight=0.10
    )
    db.add(weights)
    db.commit()

    return {"message": "Job created successfully.", "job_id": str(job.id)}


@router.get("/jobs")
async def get_recruiter_jobs(
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Get all jobs posted by the logged-in recruiter."""
    jobs = db.query(Job).filter(Job.recruiter_id == current_user.id).order_by(Job.created_at.desc()).all()
    return [
        {
            "id": str(j.id),
            "title": j.title,
            "company": j.company,
            "location": j.location,
            "status": j.status.value if hasattr(j.status, 'value') else j.status,
            "required_skills": j.required_skills,
            "created_at": j.created_at.isoformat(),
            "applicant_count": db.query(Application).filter(Application.job_id == j.id).count(),
        }
        for j in jobs
    ]


# ─── 2. EVALUATION WEIGHT MANAGEMENT ─────────────────────────────────────

@router.get("/jobs/{job_id}/weights")
async def get_job_weights(
    job_id: UUID,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Get evaluation weights for a specific job."""
    return candidate_scoring_service.get_job_weights(db, job_id)


@router.put("/jobs/{job_id}/weights")
async def update_job_weights(
    job_id: UUID,
    req: EvaluationWeightUpdateSchema,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Update job evaluation weights and recalculate candidate scores."""
    total = round(req.ats_weight + req.coding_weight + req.skill_weight + req.interview_weight, 2)
    if total <= 0:
        raise HTTPException(status_code=400, detail="Evaluation weights sum must be greater than zero.")

    w_obj = db.query(EvaluationWeight).filter(EvaluationWeight.job_id == job_id).first()
    if not w_obj:
        w_obj = EvaluationWeight(job_id=job_id)
        db.add(w_obj)

    w_obj.ats_weight = req.ats_weight
    w_obj.coding_weight = req.coding_weight
    w_obj.skill_weight = req.skill_weight
    w_obj.interview_weight = req.interview_weight
    db.commit()

    # Recalculate candidate scores for all applicants
    apps = db.query(Application).filter(Application.job_id == job_id).all()
    for app in apps:
        candidate_scoring_service.evaluate_candidate_for_job(db, app.candidate_id, job_id)

    return {"message": "Job weights updated and candidate scores recalculated.", "weights": req.dict()}


# ─── 3. EXPLAINABLE CANDIDATE RANKINGS ─────────────────────────────────────

@router.get("/jobs/{job_id}/rankings")
async def get_candidate_rankings(
    job_id: UUID,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """
    Explainable Multi-Dimensional Candidate Ranking Algorithm:
    Overall Score = W_ats*ATS + W_code*Coding + W_skill*SkillMatch + W_int*Interview.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    apps = db.query(Application).filter(
        Application.job_id == job_id,
        Application.status != ApplicationStatus.REJECTED
    ).options(
        joinedload(Application.candidate),
        joinedload(Application.resume)
    ).all()

    rankings = []
    for idx, app in enumerate(apps):
        cand = app.candidate
        eval_res = candidate_scoring_service.evaluate_candidate_for_job(db, app.candidate_id, job_id)

        rankings.append({
            "candidate_id": str(app.candidate_id),
            "application_id": str(app.id),
            "name": cand.full_name if cand else f"Candidate {idx+1}",
            "email": cand.email if cand else "candidate@example.com",
            "overall_score": eval_res["overall_score"],
            "ats_score": eval_res["ats_score"],
            "coding_score": eval_res["coding_score"],
            "skill_match_score": eval_res["skill_match_score"],
            "interview_score": eval_res["interview_score"],
            "match_level": eval_res["match_level"],
            "mismatch_warning": eval_res["mismatch_warning"],
            "status": app.status.value if hasattr(app.status, 'value') else app.status,
            "is_shortlisted": app.is_shortlisted,
            "matched_skills": eval_res["matched_skills"],
            "missing_skills": eval_res["missing_skills"],
            "why_ranked": f"Ranked #{idx+1} with {eval_res['overall_score']}% overall score ({eval_res['ats_score']}% ATS, {eval_res['coding_score']}% Coding, {eval_res['skill_match_score']}% Skills)."
        })

    # Sort descending by overall score
    rankings.sort(key=lambda x: x["overall_score"], reverse=True)
    for rank_idx, item in enumerate(rankings):
        item["rank"] = rank_idx + 1

    return {
        "job_id": str(job_id),
        "job_title": job.title,
        "total_candidates": len(rankings),
        "rankings": rankings
    }


# ─── 4. 360° CANDIDATE PROFILE & COMPARISON ─────────────────────────────────

@router.get("/jobs/{job_id}/candidates/{candidate_id}")
async def get_candidate_detail_profile(
    job_id: UUID,
    candidate_id: UUID,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """360-degree Candidate Profile details for recruiters."""
    cand = db.query(User).filter(User.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    eval_res = candidate_scoring_service.evaluate_candidate_for_job(db, candidate_id, job_id)
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == candidate_id).first()

    return {
        "candidate_id": str(candidate_id),
        "full_name": cand.full_name,
        "email": cand.email,
        "experience_years": profile.experience_years if profile else 3,
        "bio": profile.bio if profile else "Software Developer",
        "evaluation": eval_res
    }


@router.post("/jobs/{job_id}/compare")
async def compare_candidates(
    job_id: UUID,
    req: CompareRequest,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Side-by-side comparison of candidate scores and skill profiles."""
    results = []
    for cid in req.candidate_ids:
        cand = db.query(User).filter(User.id == cid).first()
        if cand:
            eval_res = candidate_scoring_service.evaluate_candidate_for_job(db, cid, job_id)
            results.append({
                "candidate_id": str(cid),
                "name": cand.full_name,
                "email": cand.email,
                "overall_score": eval_res["overall_score"],
                "ats_score": eval_res["ats_score"],
                "coding_score": eval_res["coding_score"],
                "skill_match_score": eval_res["skill_match_score"],
                "interview_score": eval_res["interview_score"],
                "matched_skills": eval_res["matched_skills"],
                "missing_skills": eval_res["missing_skills"],
            })
    return {"comparison": results}


# ─── 5. RECRUITER ANALYTICS & SCATTER PLOTS ─────────────────────────────────

@router.get("/jobs/{job_id}/analytics")
async def get_job_recruiter_analytics(
    job_id: UUID,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Recruiter Analytics: Funnel, ATS vs Coding Scatter Plot & Score Histogram."""
    apps = db.query(Application).filter(Application.job_id == job_id).all()
    rankings_res = await get_candidate_rankings(job_id, current_user, db)
    rankings = rankings_res.get("rankings", [])

    total_applicants = len(apps)
    shortlisted = len([a for a in apps if a.is_shortlisted])

    scatter_data = [
        {
            "name": r["name"],
            "ats_score": r["ats_score"],
            "coding_score": r["coding_score"],
            "overall_score": r["overall_score"],
        }
        for r in rankings
    ]

    return {
        "job_id": str(job_id),
        "total_applicants": total_applicants,
        "shortlisted": shortlisted,
        "avg_ats": round(sum(r["ats_score"] for r in rankings) / max(1, len(rankings)), 1),
        "avg_coding": round(sum(r["coding_score"] for r in rankings) / max(1, len(rankings)), 1),
        "avg_overall": round(sum(r["overall_score"] for r in rankings) / max(1, len(rankings)), 1),
        "scatter_data": scatter_data,
        "funnel": [
            {"stage": "Applied", "count": total_applicants},
            {"stage": "AI Evaluated", "count": len(rankings)},
            {"stage": "Shortlisted", "count": shortlisted},
            {"stage": "Interviewed", "count": max(1, shortlisted // 2)},
            {"stage": "Selected", "count": 1},
        ]
    }


# ─── 6. SHORTLIST, REJECT & INTERVIEW ACTIONS ─────────────────────────────

@router.post("/shortlist")
async def shortlist_candidate(
    req: ShortlistRequest,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Shortlist a candidate for a job."""
    app = db.query(Application).filter(
        Application.candidate_id == req.candidate_id,
        Application.job_id == req.job_id
    ).first()

    if not app:
        app = Application(
            candidate_id=req.candidate_id,
            job_id=req.job_id,
            status=ApplicationStatus.SHORTLISTED,
            is_shortlisted=True,
            recruiter_notes="Candidate shortlisted for next interview round",
            applied_at=datetime.utcnow()
        )
        db.add(app)
    else:
        app.status = ApplicationStatus.SHORTLISTED
        app.is_shortlisted = True
        app.recruiter_notes = "Candidate shortlisted for next interview round"

    db.commit()
    return {"message": "Candidate shortlisted successfully.", "status": "SHORTLISTED"}


@router.post("/reject")
async def reject_candidate(
    req: RejectRequest,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Reject a candidate with reason."""
    app = db.query(Application).filter(
        Application.candidate_id == req.candidate_id,
        Application.job_id == req.job_id
    ).first()

    if app:
        app.status = ApplicationStatus.REJECTED
        app.is_shortlisted = False
        app.recruiter_notes = f"Rejection reason: {req.reason}"

        notif = Notification(
            user_id=req.candidate_id,
            type=NotificationType.REJECTED,
            title="Application Status Updated",
            message=f"Your application status has been updated to Rejected. Reason: {req.reason}"
        )
        db.add(notif)
        db.commit()

    return {"message": "Candidate rejected.", "status": "REJECTED", "reason": req.reason}


@router.post("/interviews")
async def schedule_interview(
    req: ScheduleInterviewRequest,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Schedule interview with application association."""
    try:
        itype = InterviewType(req.interview_type)
    except ValueError:
        itype = InterviewType.TECHNICAL

    app = db.query(Application).filter(
        Application.candidate_id == req.candidate_id,
        Application.job_id == req.job_id
    ).first()
    if not app:
        app = Application(
            candidate_id=req.candidate_id,
            job_id=req.job_id,
            status=ApplicationStatus.APPLIED
        )
        db.add(app)
        db.flush()

    app.status = ApplicationStatus.INTERVIEW_SCHEDULED

    interview = Interview(
        application_id=app.id,
        recruiter_id=current_user.id,
        candidate_id=req.candidate_id,
        job_id=req.job_id,
        interview_type=itype,
        scheduled_at=req.scheduled_at,
        duration_minutes=req.duration_minutes,
        meeting_link=req.meeting_link or "https://meet.jit.si/hireai-interview",
        location=req.location or "Online",
        notes=req.notes,
        status=InterviewStatus.SCHEDULED
    )
    db.add(interview)

    notif = Notification(
        user_id=req.candidate_id,
        type=NotificationType.INTERVIEW_SCHEDULED,
        title="📅 New Interview Scheduled!",
        message=f"A {itype.value} interview has been scheduled for {req.scheduled_at.strftime('%b %d, %Y at %H:%M')}. Location: {req.location or 'Online'} ({req.meeting_link or 'https://meet.jit.si/hireai-interview'})"
    )
    db.add(notif)
    db.commit()
    db.refresh(interview)

    return {
        "message": "Interview scheduled successfully.",
        "interview_id": str(interview.id),
        "scheduled_at": interview.scheduled_at.isoformat()
    }


@router.get("/jobs/{job_id}/matched-candidates")
async def get_matched_candidates_for_job(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    """Retrieve ranked matched candidate list for a specific job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    resumes = db.query(Resume).filter(Resume.is_parsed == True).all()
    results = []

    from app.ai.ats_scorer import ats_scorer
    from app.models.ml_models import ResumeJobMatch

    for r in resumes:
        # Get candidate user
        cand_user = db.query(User).filter(User.id == r.user_id).first()
        if not cand_user:
            continue

        parsed_resume = {
            "skills": r.parsed_skills or [],
            "experience": r.parsed_experience or [],
            "projects": r.parsed_projects or [],
            "education": r.parsed_education or [],
            "certifications": r.parsed_certifications or [],
        }

        # Calculate matching metrics
        match_info = ats_scorer.calculate_match_score(
            parsed_resume,
            job_description=job.description,
            required_skills=job.required_skills,
            preferred_skills=job.preferred_skills,
            min_experience_years=job.min_experience_years or 0,
            required_education=job.required_education
        )

        ats_info = ats_scorer.score(
            parsed_resume,
            job_description=job.description,
            job_skills=job.required_skills
        )

        # Cache results in database table
        match_record = db.query(ResumeJobMatch).filter(
            ResumeJobMatch.resume_id == r.id,
            ResumeJobMatch.job_id == job.id
        ).first()

        if not match_record:
            match_record = ResumeJobMatch(
                resume_id=r.id,
                candidate_id=cand_user.id,
                job_id=job.id
            )
            db.add(match_record)

        match_record.ats_score = ats_info["ats_score"]
        match_record.match_score = match_info["match_score"]
        match_record.skill_score = match_info["skill_score"]
        match_record.experience_score = match_info["experience_score"]
        match_record.semantic_score = match_info["semantic_score"]
        match_record.project_score = match_info["project_score"]
        match_record.education_score = match_info["education_score"]
        match_record.matched_skills = match_info["matched_skills"]
        match_record.missing_skills = match_info["missing_skills"]
        match_record.partial_skills = match_info["matched_preferred"]
        db.commit()

        # Check application status
        app_status = "None"
        application = db.query(Application).filter(
            Application.candidate_id == cand_user.id,
            Application.job_id == job.id
        ).first()
        if application:
            app_status = application.status.value

        results.append({
            "candidate_id": str(cand_user.id),
            "candidate_name": cand_user.full_name,
            "resume_id": str(r.id),
            "match_score": match_info["match_score"],
            "ats_score": ats_info["ats_score"],
            "matched_skills": match_info["matched_skills"],
            "missing_skills": match_info["missing_skills"],
            "partial_skills": match_info["matched_preferred"],
            "experience": match_info["experience_match"],
            "education": match_info["education_match"],
            "application_status": app_status
        })

    # Sort descending by match score
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results


@router.get("/candidates")
async def get_recruiter_candidates_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    """Retrieve list of candidates who have applied to recruiter's jobs, excluding rejected ones."""
    # 1. Fetch all jobs posted by this recruiter
    jobs = db.query(Job).filter(Job.recruiter_id == current_user.id).all()
    job_ids = [j.id for j in jobs]
    if not job_ids:
        return []

    # 2. Fetch active applications (excluding REJECTED status)
    applications = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status != ApplicationStatus.REJECTED
    ).all()
    
    candidate_ids = {app.candidate_id for app in applications}
    if not candidate_ids:
        return []

    # 3. Fetch candidates who applied
    candidates = db.query(User).filter(
        User.role == UserRole.CANDIDATE,
        User.id.in_(candidate_ids)
    ).all()

    results = []
    for c in candidates:
        resume = db.query(Resume).filter(
            Resume.user_id == c.id,
            Resume.is_parsed == True
        ).order_by(Resume.is_primary.desc(), Resume.created_at.desc()).first()
        
        # Get target job applied title
        app = next((a for a in applications if a.candidate_id == c.id), None)
        job_title = ""
        if app:
            job_obj = next((j for j in jobs if j.id == app.job_id), None)
            if job_obj:
                job_title = job_obj.title
        
        results.append({
            "candidate_id": str(c.id),
            "name": c.full_name,
            "email": c.email,
            "location": c.location or (resume.parsed_location if resume else "Remote"),
            "skills": resume.parsed_skills if resume else [],
            "ats_score": resume.ats_score if resume else 0.0,
            "applied_job_title": job_title
        })
    return results


@router.get("/interviews")
async def list_scheduled_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    """List all scheduled interviews for the recruiter."""
    interviews = db.query(Interview).filter(Interview.recruiter_id == current_user.id).all()
    results = []
    for i in interviews:
        candidate = db.query(User).filter(User.id == i.candidate_id).first()
        job = db.query(Job).filter(Job.id == i.job_id).first()
        results.append({
            "id": str(i.id),
            "candidate_name": candidate.full_name if candidate else "Candidate",
            "candidate_email": candidate.email if candidate else "Email",
            "job_title": job.title if job else "Job",
            "job_company": job.company if job else "Company",
            "interview_type": i.interview_type.value,
            "status": i.status.value,
            "scheduled_at": i.scheduled_at.isoformat(),
            "duration_minutes": i.duration_minutes,
            "meeting_link": i.meeting_link,
            "notes": i.notes
        })
    return results


class RescheduleRequest(BaseModel):
    scheduled_at: datetime
    duration_minutes: Optional[int] = 45
    meeting_link: Optional[str] = None


@router.put("/interviews/{interview_id}")
async def reschedule_interview(
    interview_id: UUID,
    req: RescheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    """Reschedule an existing interview."""
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.recruiter_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    interview.scheduled_at = req.scheduled_at
    interview.duration_minutes = req.duration_minutes or interview.duration_minutes
    if req.meeting_link:
        interview.meeting_link = req.meeting_link
    interview.status = InterviewStatus.RESCHEDULED
    db.commit()
    return {"message": "Interview rescheduled successfully."}


@router.delete("/interviews/{interview_id}")
async def cancel_interview(
    interview_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    """Cancel and delete an interview."""
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.recruiter_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    # Revert Application status
    app = db.query(Application).filter(
        Application.candidate_id == interview.candidate_id,
        Application.job_id == interview.job_id
    ).first()
    if app:
        app.status = ApplicationStatus.SHORTLISTED

    db.delete(interview)
    db.commit()
    return {"message": "Interview cancelled successfully."}
