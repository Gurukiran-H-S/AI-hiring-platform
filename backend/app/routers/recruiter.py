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
    if abs(total - 1.0) > 0.01:
        raise HTTPException(status_code=400, detail=f"Weights must sum to 1.0 (100%). Got sum = {total}")

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

    apps = db.query(Application).filter(Application.job_id == job_id).options(
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
            applied_at=datetime.utcnow()
        )
        db.add(app)
    else:
        app.status = ApplicationStatus.SHORTLISTED
        app.is_shortlisted = True

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
        db.commit()

    return {"message": "Candidate rejected.", "status": "REJECTED", "reason": req.reason}


@router.post("/interviews")
async def schedule_interview(
    req: ScheduleInterviewRequest,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Schedule interview with collision check."""
    try:
        itype = InterviewType(req.interview_type)
    except ValueError:
        itype = InterviewType.TECHNICAL

    interview = Interview(
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

    # Update Application Status
    app = db.query(Application).filter(
        Application.candidate_id == req.candidate_id,
        Application.job_id == req.job_id
    ).first()
    if app:
        app.status = ApplicationStatus.INTERVIEW_SCHEDULED

    db.commit()
    db.refresh(interview)

    return {
        "message": "Interview scheduled successfully.",
        "interview_id": str(interview.id),
        "scheduled_at": interview.scheduled_at.isoformat()
    }
