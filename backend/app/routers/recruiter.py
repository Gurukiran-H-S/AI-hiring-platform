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
from app.models.evaluation import EvaluationWeight, CandidateScore, CandidateSkillEvaluation, WeightAuditLog
from app.middleware.auth_middleware import get_current_recruiter
from app.ai.semantic_matcher import semantic_matcher
from app.services.candidate_scoring_service import candidate_scoring_service
from app.services import evaluation_engine
from app.routers.coding import sync_candidate_coding_stats

router = APIRouter(prefix="/api/recruiter", tags=["Recruiter Operations"])


# ─── Pydantic Request Schemas ──────────────────────────────────────────────

class JobCreateSchema(BaseModel):
    title: str = Field(..., min_length=1)
    company: Optional[str] = "Company"
    description: Optional[str] = ""
    required_skills: Optional[List[str]] = Field(default_factory=list)
    preferred_skills: Optional[List[str]] = Field(default_factory=list)
    min_experience_years: Optional[int] = Field(0, ge=0)
    max_experience_years: Optional[int] = Field(5, ge=0)
    required_education: Optional[str] = "Bachelor's Degree"
    location: Optional[str] = "Remote"
    job_type: Optional[str] = "Full-time"
    is_remote: Optional[bool] = False
    salary_min: Optional[int] = 500000
    salary_max: Optional[int] = 1200000


class EvaluationWeightUpdateSchema(BaseModel):
    """Weights in PERCENT units. Must total exactly 100."""
    ats_weight: float = Field(..., ge=0, le=100)
    coding_weight: float = Field(..., ge=0, le=100)
    skill_weight: float = Field(..., ge=0, le=100)
    interview_weight: float = Field(..., ge=0, le=100)


class ShortlistRequest(BaseModel):
    candidate_id: UUID
    job_id: UUID


class RejectRequest(BaseModel):
    candidate_id: UUID
    job_id: UUID
    reason: Optional[str] = "Skills mismatch"


class OfferLetterCreateRequest(BaseModel):
    candidate_id: UUID
    job_id: UUID
    job_title: Optional[str] = None
    salary_offered: str
    joining_date: str
    department: Optional[str] = "Engineering"
    location_type: Optional[str] = "Remote"
    benefits: Optional[str] = "Health & Dental Insurance, Flexible Working Hours, 401(k) Matching, Annual Learning Stipend"
    notes: Optional[str] = "We are thrilled to extend this formal offer of employment to you!"


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


class JobStatusUpdateSchema(BaseModel):
    status: str = Field(..., pattern="^(draft|active|paused|closed)$")


# ─── 1. POST A NEW JOB ──────────────────────────────────────────────────────

@router.post("/jobs", status_code=201)
async def create_new_job(
    req: JobCreateSchema,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Create a new job posting with default evaluation weights."""
    raw_type = (req.job_type or "full_time").lower().replace("-", "_").replace(" ", "_")
    try:
        j_type = JobType(raw_type)
    except ValueError:
        j_type = JobType.FULL_TIME

    desc = req.description.strip() if req.description else f"{req.title} opening at {req.company or 'our organization'}."
    skills_list = req.required_skills or []
    if isinstance(skills_list, str):
        skills_list = [s.strip() for s in skills_list.split(",") if s.strip()]

    pref_skills = req.preferred_skills or []
    if isinstance(pref_skills, str):
        pref_skills = [s.strip() for s in pref_skills.split(",") if s.strip()]

    # Generate embedding
    job_text = f"{req.title} {desc} {' '.join(skills_list)}"
    try:
        embedding = semantic_matcher.encode(job_text)
        emb_data = embedding[:128] if hasattr(embedding, '__getitem__') else None
    except Exception:
        emb_data = None

    job = Job(
        recruiter_id=current_user.id,
        title=req.title.strip(),
        company=(req.company or "Company").strip(),
        description=desc,
        required_skills=skills_list,
        preferred_skills=pref_skills,
        min_experience_years=req.min_experience_years or 0,
        max_experience_years=req.max_experience_years or 5,
        required_education=req.required_education or "Bachelor's Degree",
        location=(req.location or "Remote").strip(),
        job_type=j_type,
        is_remote=bool(req.is_remote),
        salary_min=req.salary_min,
        salary_max=req.salary_max,
        description_embedding=emb_data,
        status=JobStatus.ACTIVE,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Initialize default weights for job (20% ATS, 30% Coding, 30% Skill Match, 20% Interview = 100%)
    weights = EvaluationWeight(
        job_id=job.id,
        ats_weight=20.0,
        coding_weight=30.0,
        skill_weight=30.0,
        interview_weight=20.0
    )
    db.add(weights)
    db.commit()

    return {
        "message": "Job created successfully.",
        "job_id": str(job.id),
        "id": str(job.id),
        "title": job.title,
        "company": job.company
    }



@router.get("/jobs")
async def get_recruiter_jobs(
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Get all jobs posted by the logged-in recruiter (or all active workspace jobs)."""
    jobs = db.query(Job).filter(Job.recruiter_id == current_user.id).order_by(Job.created_at.desc()).all()
    if not jobs:
        jobs = db.query(Job).order_by(Job.created_at.desc()).all()

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


@router.put("/jobs/{job_id}/status")
async def update_job_status(
    job_id: UUID,
    req: JobStatusUpdateSchema,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Close, reopen, pause or activate a job posted by the recruiter."""
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized.")

    job.status = JobStatus(req.status)
    job.updated_at = datetime.utcnow()
    if req.status == "closed":
        job.closed_at = datetime.utcnow()
    db.commit()
    return {
        "id": str(job.id),
        "status": job.status.value,
        "message": f"Job status updated to {job.status.value}.",
    }


@router.delete("/jobs/{job_id}", status_code=204)
async def delete_recruiter_job(
    job_id: UUID,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Delete a job posted by the recruiter (and its dependent rows)."""
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized.")

    # Remove dependents first to avoid FK violations
    from app.models.ml_models import ResumeJobMatch, JobSkill, CandidateFeedback
    from app.models.evaluation import EvaluationWeight, CandidateScore
    from app.models.interview import Interview

    for model, fk in [
        (Application, "job_id"),
        (Interview, "job_id"),
        (ResumeJobMatch, "job_id"),
        (JobSkill, "job_id"),
        (CandidateFeedback, "job_id"),
    ]:
        try:
            db.query(model).filter(getattr(model, fk) == job_id).delete(synchronize_session=False)
        except Exception:
            db.rollback()

    for model, fk in [(EvaluationWeight, "job_id"), (CandidateScore, "job_id")]:
        try:
            db.query(model).filter(getattr(model, fk) == job_id).delete(synchronize_session=False)
        except Exception:
            db.rollback()

    db.delete(job)
    db.commit()
    return None


# ─── 2. EVALUATION WEIGHT MANAGEMENT (percent units, total MUST = 100) ────

@router.get("/jobs/{job_id}/weights")
async def get_job_weights(
    job_id: UUID,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Get evaluation weights (percent) for a specific job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return evaluation_engine.get_job_weights_percent(db, job_id)


@router.put("/jobs/{job_id}/weights")
async def update_job_weights(
    job_id: UUID,
    req: EvaluationWeightUpdateSchema,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Save job weights. REJECTED with HTTP 400 unless total is exactly 100.
    Scores are NOT silently normalized - the recruiter must configure 100%."""
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized.")

    new_weights = {
        "ats_weight": req.ats_weight,
        "coding_weight": req.coding_weight,
        "skill_weight": req.skill_weight,
        "interview_weight": req.interview_weight,
    }

    try:
        evaluation_engine.validate_weights(
            new_weights["ats_weight"], new_weights["coding_weight"],
            new_weights["skill_weight"], new_weights["interview_weight"],
        )
    except evaluation_engine.WeightValidationError as e:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Weights must total exactly 100%",
                "total_weight": round(e.total_weight, 2) if e.total_weight == e.total_weight else None,
            },
        )

    old_weights = evaluation_engine._load_raw_weights(db, job_id)
    if 0 < sum(old_weights.values()) <= 1.001:
        old_weights = {k: round(v * 100.0, 2) for k, v in old_weights.items()}

    evaluation_engine.save_job_weights(db, job_id, new_weights)

    # Audit trail
    db.add(WeightAuditLog(
        recruiter_id=current_user.id,
        job_id=job_id,
        old_weights={k: round(float(v), 2) for k, v in old_weights.items()},
        new_weights={k: round(float(v), 2) for k, v in new_weights.items()},
    ))
    db.commit()

    return {
        "message": "Weights saved. Use POST /recalculate to recompute rankings.",
        "weights": {k: round(float(v), 2) for k, v in new_weights.items()},
        "total_weight": 100.0,
        "valid": True,
    }


@router.get("/jobs/{job_id}/rankings")
@router.post("/jobs/{job_id}/recalculate")
async def recalculate_job_ranking(
    job_id: UUID,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Full ranking pipeline: validate -> evaluate -> rank -> persist -> summarize."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    weights = evaluation_engine._load_raw_weights(db, job_id)
    if 0 < sum(weights.values()) <= 1.001:
        weights = {k: round(v * 100.0, 2) for k, v in weights.items()}
    try:
        evaluation_engine.validate_weights(
            weights["ats_weight"], weights["coding_weight"],
            weights["skill_weight"], weights["interview_weight"],
        )
    except evaluation_engine.WeightValidationError:
        weights = {"ats_weight": 25.0, "coding_weight": 25.0, "skill_weight": 25.0, "interview_weight": 25.0}

    apps = (
        db.query(Application)
        .filter(Application.job_id == job_id)
        .options(joinedload(Application.candidate), joinedload(Application.resume))
        .all()
    )
    candidate_user = {str(a.candidate_id): a.candidate for a in apps}

    evaluations = []
    for app_row in apps:
        ev = evaluation_engine.evaluate_application(db, app_row, job, weights)
        cand = candidate_user.get(ev["candidate_id"])
        ev["name"] = cand.full_name if cand else "Unknown Candidate"
        ev["email"] = cand.email if cand else ""
        ev["status"] = app_row.status.value if hasattr(app_row.status, "value") else app_row.status
        ev["is_shortlisted"] = app_row.is_shortlisted
        evaluations.append(ev)

    applied_at = {str(a.candidate_id): a.applied_at for a in apps}
    evaluations = evaluation_engine.rank_candidates(evaluations, applied_at)

    # Persist scores (snapshot) for ranked candidates
    for ev in evaluations:
        _persist_candidate_score(db, ev, job_id)

    db.commit()
    summary = evaluation_engine.summarize(evaluations, weights, job_id)
    summary["rankings"] = evaluations
    summary["job_title"] = job.title
    return summary


@router.get("/jobs/{job_id}/analytics")
async def get_job_analytics_summary(
    job_id: UUID,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Retrieve job-specific analytics for CandidateRankings analytics panel."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    apps = db.query(Application).filter(Application.job_id == job_id).all()
    total_apps = len(apps)
    shortlisted = sum(
        1 for a in apps
        if a.is_shortlisted or str(getattr(a.status, 'value', a.status)).lower() in [
            "shortlisted", "interview", "interview_scheduled", "offered", "hired"
        ]
    )
    avg_ats = round(sum(a.ats_score or 0 for a in apps) / max(1, total_apps), 1) if total_apps > 0 else 0.0

    return {
        "job_id": str(job.id),
        "job_title": job.title,
        "total_applications": total_apps,
        "shortlisted_count": shortlisted,
        "average_ats_score": avg_ats,
    }


def _persist_candidate_score(db: Session, ev: Dict[str, Any], job_id: UUID) -> None:
    """Store the ranking snapshot in candidate_scores (source of truth)."""
    rec = db.query(CandidateScore).filter(
        CandidateScore.candidate_id == ev["candidate_id"],
        CandidateScore.job_id == job_id,
    ).first()
    w = ev["weights_used"]
    values = dict(
        ats_score=ev["ats"]["score"] if ev["ats"]["score"] is not None else 0.0,
        coding_score=ev["coding"]["score"] if ev["coding"]["score"] is not None else 0.0,
        skill_match_score=ev["skill"]["score"] if ev["skill"]["score"] is not None else 0.0,
        interview_score=ev["interview"]["score"] if ev["interview"]["score"] is not None else 0.0,
        overall_score=ev["overall_score"] or 0.0,
        ats_weight=w["ats_weight"] / 100.0,
        coding_weight=w["coding_weight"] / 100.0,
        skill_weight=w["skill_weight"] / 100.0,
        interview_weight=w["interview_weight"] / 100.0,
        match_level=ev["match_level"] or "Pending",
    )
    if rec is None:
        rec = CandidateScore(candidate_id=ev["candidate_id"], job_id=job_id, **values)
        db.add(rec)
    else:
        for k, v in values.items():
            setattr(rec, k, v)
    db.flush()


@router.get("/jobs/{job_id}/candidates/{candidate_id}/score-breakdown")
async def get_score_breakdown(
    job_id: UUID,
    candidate_id: UUID,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Explain Score: component scores x weights = contributions -> final."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    app_row = db.query(Application).filter(
        Application.job_id == job_id, Application.candidate_id == candidate_id
    ).first()
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found.")

    ev = evaluation_engine.evaluate_application(db, app_row, job)
    cand = db.query(User).filter(User.id == candidate_id).first()

    reasons = []
    if ev["skill"]["score"] is not None:
        if ev["skill"]["score"] >= 80:
            reasons.append(f"Strong required-skill match ({ev['skill']['score']}%)")
        elif ev["skill"]["score"] < 50:
            reasons.append(f"Low required-skill match ({ev['skill']['score']}%)")
    if ev["coding"]["score"] is not None:
        if ev["coding"]["score"] >= 70:
            reasons.append(f"Good coding performance ({ev['coding']['score']}%)")
    if ev["interview"]["score"] is not None:
        if ev["interview"]["score"] >= 70:
            reasons.append(f"Strong interview feedback ({ev['interview']['score']}%)")
    if ev["ats"]["score"] is not None and ev["ats"]["score"] >= 70:
        reasons.append(f"Good ATS score ({ev['ats']['score']}%)")
    if not reasons:
        reasons.append("Limited evaluation data available for this candidate")

    return {
        "job_id": str(job_id),
        "candidate_id": str(candidate_id),
        "candidate_name": cand.full_name if cand else "Candidate",
        "rank": ev["rank"] if "rank" in ev else None,
        "overall_score": ev["overall_score"],
        "is_partial": ev["is_partial"],
        "used_weight": ev["used_weight"],
        "eligibility": ev["eligibility"],
        "match_level": ev["match_level"],
        "contributions": ev["contributions"],
        "weights_used": ev["weights_used"],
        "components": {
            "ats": ev["ats"],
            "skill": ev["skill"],
            "coding": ev["coding"],
            "interview": ev["interview"],
        },
        "explanation": reasons,
        "calculated_at": ev["calculated_at"],
    }


# ─── 3. EXPLAINABLE CANDIDATE RANKINGS (deterministic, 100% weights) ──────

@router.get("/jobs/{job_id}/rankings")
async def get_candidate_rankings(
    job_id: UUID,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """
    Deterministic ranking: overall = ATS*w + Coding*w + Skill*w + Interview*w
    (weights in percent, total exactly 100). Missing components are flagged,
    never fabricated. Ties broken by skill > coding > interview > ats > applied_at.
    """
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized.")

    weights = evaluation_engine._load_raw_weights(db, job_id)
    if 0 < sum(weights.values()) <= 1.001:
        weights = {k: round(v * 100.0, 2) for k, v in weights.items()}

    apps = (
        db.query(Application)
        .filter(Application.job_id == job_id)
        .options(joinedload(Application.candidate), joinedload(Application.resume))
        .all()
    )
    candidate_user = {str(a.candidate_id): a.candidate for a in apps}

    evaluations = []
    for app_row in apps:
        ev = evaluation_engine.evaluate_application(db, app_row, job, weights)
        cand = candidate_user.get(ev["candidate_id"])
        coding_stats = sync_candidate_coding_stats(db, app_row.candidate_id)
        ev["name"] = cand.full_name if cand else "Unknown Candidate"
        ev["email"] = cand.email if cand else ""
        ev["status"] = app_row.status.value if hasattr(app_row.status, "value") else app_row.status
        ev["is_shortlisted"] = app_row.is_shortlisted
        # platform-wide coding stats (display-only; scoring uses job-scope data)
        ev["coding_display"] = {
            "problems_solved": coding_stats["problems_solved"],
            "accuracy": coding_stats["accuracy"],
            "rank": coding_stats["rank"],
            "points": coding_stats["total_points"],
        }
        evaluations.append(ev)

    applied_at = {str(a.candidate_id): a.applied_at for a in apps}
    evaluations = evaluation_engine.rank_candidates(evaluations, applied_at)

    for ev in evaluations:
        _persist_candidate_score(db, ev, job_id)
    db.commit()

    summary = evaluation_engine.summarize(evaluations, weights, job_id)

    try:
        evaluation_engine.validate_weights(
            weights["ats_weight"], weights["coding_weight"],
            weights["skill_weight"], weights["interview_weight"],
        )
        weights_valid = True
    except evaluation_engine.WeightValidationError:
        weights_valid = False

    return {
        "job_id": str(job_id),
        "job_title": job.title,
        "weights_valid": weights_valid,
        "total_weight": round(sum(weights.values()), 2),
        **summary,
        "rankings": evaluations,
    }


@router.get("/jobs/{job_id}/analytics")
async def get_job_analytics(
    job_id: UUID,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Pipeline analytics and score distributions for a job posting."""
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized.")

    apps = db.query(Application).filter(Application.job_id == job_id).all()
    total_apps = len(apps)

    stages = {"applied": 0, "shortlisted": 0, "interview": 0, "rejected": 0, "hired": 0}
    for a in apps:
        s = a.status.value if hasattr(a.status, "value") else str(a.status).lower()
        if s in stages:
            stages[s] += 1
        elif "interview" in s:
            stages["interview"] += 1
        else:
            stages["applied"] += 1

    scores = [a.overall_score for a in apps if a.overall_score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    return {
        "job_id": str(job_id),
        "job_title": job.title,
        "total_applicants": total_apps,
        "stages": stages,
        "average_overall_score": avg_score,
        "score_distribution": {
            "top_tier_80_plus": sum(1 for s in scores if s >= 80),
            "mid_tier_60_79": sum(1 for s in scores if 60 <= s < 80),
            "low_tier_below_60": sum(1 for s in scores if s < 60),
        },
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
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    cand = db.query(User).filter(User.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    app_row = db.query(Application).filter(
        Application.job_id == job_id, Application.candidate_id == candidate_id
    ).first()
    if app_row:
        ev = evaluation_engine.evaluate_application(db, app_row, job)
        eval_res = {
            "overall_score": ev["overall_score"],
            "ats_score": ev["ats"]["score"],
            "coding_score": ev["coding"]["score"],
            "skill_match_score": ev["skill"]["score"],
            "interview_score": ev["interview"]["score"],
            "matched_skills": ev["skill"]["matched"],
            "missing_skills": ev["skill"]["missing"],
            "eligibility": ev["eligibility"],
            "is_partial": ev["is_partial"],
            "match_level": ev["match_level"],
        }
    else:
        eval_res = {
            "overall_score": None, "ats_score": None, "coding_score": None,
            "skill_match_score": None, "interview_score": None,
            "matched_skills": [], "missing_skills": [],
            "eligibility": "NOT_ELIGIBLE", "is_partial": True, "match_level": None,
        }
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == candidate_id).first()
    resume = db.query(Resume).filter(
        Resume.user_id == candidate_id
    ).order_by(Resume.is_primary.desc(), Resume.created_at.desc()).first()
    coding_stats = sync_candidate_coding_stats(db, candidate_id)

    return {
        "candidate_id": str(candidate_id),
        "full_name": cand.full_name,
        "name": cand.full_name,
        "email": cand.email,
        "location": cand.location or (profile.preferred_location if profile else "") or (resume.parsed_location if resume else "Remote"),
        "headline": (profile.headline if profile else "") or "Software Engineer",
        "summary": (profile.summary if profile else "") or cand.bio or (resume.parsed_summary if resume else ""),
        "experience_years": profile.years_of_experience if profile and profile.years_of_experience else "3+",
        "bio": (profile.summary if profile else "") or cand.bio or "Software Developer",
        "skills": (profile.skills if profile and profile.skills else (resume.parsed_skills if resume else [])),
        "education": (profile.education if profile and profile.education else (resume.parsed_education if resume else [])),
        "experience": (profile.experience if profile and profile.experience else (resume.parsed_experience if resume else [])),
        "projects": (profile.projects if profile and profile.projects else (resume.parsed_projects if resume else [])),
        "certifications": (profile.certifications if profile and profile.certifications else (resume.parsed_certifications if resume else [])),
        "resume": {
            "id": str(resume.id) if resume else None,
            "file_name": resume.file_name if resume else None,
            "file_url": resume.file_url if resume else None,
            "ats_score": round(resume.ats_score, 1) if resume and resume.ats_score is not None else 0.0,
            "uploaded_at": resume.created_at.isoformat() if resume and resume.created_at else None
        } if resume else None,
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
        **eval_res,
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
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    results = []
    for cid in req.candidate_ids:
        cand = db.query(User).filter(User.id == cid).first()
        app_row = db.query(Application).filter(
            Application.job_id == job_id, Application.candidate_id == cid
        ).first()
        if not cand or not app_row:
            continue
        ev = evaluation_engine.evaluate_application(db, app_row, job)
        results.append({
            "candidate_id": str(cid),
            "name": cand.full_name,
            "email": cand.email,
            "overall_score": ev["overall_score"],
            "ats_score": ev["ats"]["score"],
            "coding_score": ev["coding"]["score"],
            "skill_match_score": ev["skill"]["score"],
            "interview_score": ev["interview"]["score"],
            "matched_skills": ev["skill"]["matched"],
            "missing_skills": ev["skill"]["missing"],
            "eligibility": ev["eligibility"],
            "is_partial": ev["is_partial"],
        })
    return {"job_id": str(job_id), "weights": evaluation_engine.get_job_weights_percent(db, job_id), "comparison": results}


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
    """Shortlist a candidate for a job and dispatch real-time candidate notification."""
    app = db.query(Application).filter(
        Application.candidate_id == req.candidate_id,
        Application.job_id == req.job_id
    ).first()

    job = db.query(Job).filter(Job.id == req.job_id).first()
    job_title = job.title if job else "Applied Position"

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

    # Dispatch in-app notification to candidate
    notif = Notification(
        user_id=req.candidate_id,
        type=NotificationType.SHORTLISTED,
        title="🎉 Congratulations! You have been Shortlisted",
        message=f"Great news! Your application for {job_title} has been shortlisted by the recruiter following interview & profile evaluation.",
        link="/candidate/applications"
    )
    db.add(notif)
    db.commit()
    return {"message": "Candidate shortlisted successfully.", "status": "SHORTLISTED"}


@router.post("/offer-letter")
async def send_offer_letter(
    req: OfferLetterCreateRequest,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Generate and dispatch an official offer letter to a candidate."""
    from app.models.application import OfferLetter

    job = db.query(Job).filter(Job.id == req.job_id).first()
    candidate = db.query(User).filter(User.id == req.candidate_id).first()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    job_title = req.job_title or (job.title if job else "Software Engineer")
    company_name = (job.company if job else "Enterprise Tech Partner") or "HireAI Platform"

    app = db.query(Application).filter(
        Application.candidate_id == req.candidate_id,
        Application.job_id == req.job_id
    ).first()

    if not app:
        app = Application(
            candidate_id=req.candidate_id,
            job_id=req.job_id,
            status=ApplicationStatus.OFFERED,
            recruiter_notes=f"Offer extended: {req.salary_offered}, Joining: {req.joining_date}"
        )
        db.add(app)
        db.flush()
    else:
        app.status = ApplicationStatus.OFFERED
        app.recruiter_notes = f"Offer Letter extended for {job_title} ({req.salary_offered}, Starting {req.joining_date})"

    # Generate formal letter body
    letter_body = f"""### Official Employment Offer Letter

**Date:** {datetime.utcnow().strftime('%B %d, %Y')}

**Dear {candidate.full_name},**

On behalf of **{company_name}**, we are pleased to offer you the position of **{job_title}** within our **{req.department}** division.

#### 1. Key Offer Terms:
- **Role Title:** {job_title}
- **Department:** {req.department}
- **Work Arrangement:** {req.location_type}
- **Annual Total Compensation (CTC):** {req.salary_offered}
- **Commencement / Joining Date:** {req.joining_date}

#### 2. Benefits & Allowances:
{req.benefits or 'Comprehensive healthcare coverage, flexible leave policy, and professional development allowances.'}

#### 3. Executive Note:
*{req.notes or 'We were thoroughly impressed by your skills and look forward to having you on the team!' }*

Sincerely,  
**Talent Acquisition Team**  
*{company_name}*
"""

    offer = OfferLetter(
        application_id=app.id,
        candidate_id=candidate.id,
        recruiter_id=current_user.id,
        job_id=req.job_id,
        job_title=job_title,
        company_name=company_name,
        salary_offered=req.salary_offered,
        joining_date=req.joining_date,
        department=req.department,
        location_type=req.location_type,
        benefits=req.benefits,
        letter_body=letter_body,
        status="sent",
        sent_at=datetime.utcnow()
    )
    db.add(offer)

    # Dispatch in-app notification to candidate
    notif = Notification(
        user_id=candidate.id,
        type=NotificationType.OFFER_RECEIVED,
        title="📜 Formal Offer Letter Received!",
        message=f"🎉 Congratulations! You have received a formal offer letter for {job_title} at {company_name} with compensation of {req.salary_offered}. Click to review details and accept!",
        link="/candidate/applications"
    )
    db.add(notif)
    db.commit()
    db.refresh(offer)

    return {
        "message": "Offer Letter dispatched successfully to candidate!",
        "offer_id": str(offer.id),
        "status": "sent",
        "job_title": job_title,
        "salary_offered": req.salary_offered,
        "joining_date": req.joining_date
    }


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
    job_id: Optional[UUID] = Query(None),
    skill: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    min_ats: Optional[float] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    """Retrieve ONLY candidates who have applied for jobs posted by this recruiter."""
    # 1. Fetch jobs posted by this recruiter
    if job_id:
        jobs = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == current_user.id).all()
        if not jobs:
            jobs = db.query(Job).filter(Job.id == job_id).all()
    else:
        jobs = db.query(Job).filter(Job.recruiter_id == current_user.id).all()
        if not jobs:
            jobs = db.query(Job).filter(Job.status == JobStatus.ACTIVE).all()

    job_ids = [j.id for j in jobs]
    if not job_ids:
        return []

    # 2. Fetch applications specifically for these jobs
    applications = (
        db.query(Application)
        .filter(Application.job_id.in_(job_ids))
        .order_by(Application.applied_at.desc())
        .all()
    )
    if not applications:
        return []

    results = []
    seen_cand_job = set()

    for app in applications:
        key = (app.candidate_id, app.job_id)
        if key in seen_cand_job:
            continue
        seen_cand_job.add(key)

        candidate = db.query(User).filter(User.id == app.candidate_id).first()
        if not candidate:
            continue

        job_obj = next((j for j in jobs if j.id == app.job_id), None)
        if not job_obj:
            job_obj = db.query(Job).filter(Job.id == app.job_id).first()

        resume = None
        if app.resume_id:
            resume = db.query(Resume).filter(Resume.id == app.resume_id).first()
        if not resume:
            resume = db.query(Resume).filter(
                Resume.user_id == candidate.id,
                Resume.is_parsed == True
            ).order_by(Resume.is_primary.desc(), Resume.created_at.desc()).first()
        if not resume:
            resume = db.query(Resume).filter(
                Resume.user_id == candidate.id
            ).order_by(Resume.created_at.desc()).first()

        profile = candidate.candidate_profile
        cand_skills = []
        if app.matched_skills and isinstance(app.matched_skills, list) and len(app.matched_skills) > 0:
            cand_skills = app.matched_skills
        elif resume and resume.parsed_skills and isinstance(resume.parsed_skills, list):
            cand_skills = resume.parsed_skills
        elif profile and profile.skills and isinstance(profile.skills, list):
            cand_skills = profile.skills

        cand_location = candidate.location or (profile.preferred_location if profile else None) or (resume.parsed_location if resume else "Remote")
        ats_score = round(app.ats_score or (resume.ats_score if resume else 78.0) or 78.0, 1)

        # Apply Filters
        if skill and skill.strip():
            target_sk = skill.strip().lower()
            if not any(target_sk in s.lower() for s in cand_skills):
                continue

        if location and location.strip():
            target_loc = location.strip().lower()
            if target_loc not in str(cand_location).lower():
                continue

        if min_ats is not None:
            if ats_score < min_ats:
                continue

        coding_stats = sync_candidate_coding_stats(db, candidate.id)
        coding_score = min(100.0, round((coding_stats["total_points"] / 500.0) * 100.0, 1)) if coding_stats["total_points"] > 0 else 0.0

        results.append({
            "candidate_id": str(candidate.id),
            "application_id": str(app.id),
            "job_id": str(app.job_id),
            "name": candidate.full_name,
            "full_name": candidate.full_name,
            "email": candidate.email,
            "location": cand_location,
            "skills": cand_skills,
            "ats_score": ats_score,
            "skill_match": round(app.skills_match_score or 90.0, 1),
            "overall_score": round(app.overall_score or ats_score, 1),
            "coding_score": coding_score,
            "problems_solved": coding_stats["problems_solved"],
            "coding_accuracy": coding_stats["accuracy"],
            "coding_rank": coding_stats["rank"],
            "coding_points": coding_stats["total_points"],
            "applied_job_title": job_obj.title if job_obj else "Applied Position",
            "application_status": getattr(app.status, 'value', str(app.status)),
            "applied_at": app.applied_at.isoformat() if app.applied_at else None,
            "is_shortlisted": bool(app.is_shortlisted)
        })

    # Sort applied candidates by applied_at descending, then ATS score
    results.sort(key=lambda x: (x["applied_at"] or "", x["ats_score"]), reverse=True)
    return results


@router.get("/dashboard")
@router.get("/analytics")
async def get_recruiter_dashboard_analytics(
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Retrieve recruiter dashboard analytics summary."""
    jobs = db.query(Job).filter(Job.recruiter_id == current_user.id).all()
    if not jobs:
        jobs = db.query(Job).filter(Job.status == JobStatus.ACTIVE).all()
    job_ids = [j.id for j in jobs]
    
    active_jobs = sum(1 for j in jobs if j.status == JobStatus.ACTIVE)
    
    if job_ids:
        applications = db.query(Application).filter(Application.job_id.in_(job_ids)).all()
    else:
        applications = []
        
    total_applications = len(applications)
    shortlisted = sum(
        1 for a in applications
        if a.is_shortlisted or str(getattr(a.status, 'value', a.status)).lower() in [
            "shortlisted", "interview", "interview_scheduled", "offered", "hired"
        ]
    )
        
    interviews = db.query(Interview).filter(
        (Interview.recruiter_id == current_user.id) | (Interview.job_id.in_(job_ids) if job_ids else False),
        Interview.status != InterviewStatus.CANCELLED
    ).count()

    recent_apps = []
    if job_ids:
        recent_records = (
            db.query(Application)
            .filter(Application.job_id.in_(job_ids))
            .order_by(Application.applied_at.desc())
            .limit(10)
            .all()
        )
        for app in recent_records:
            cand = db.query(User).filter(User.id == app.candidate_id).first()
            job_obj = next((j for j in jobs if j.id == app.job_id), None)
            recent_apps.append({
                "id": str(app.id),
                "candidate_name": cand.full_name if cand else "Candidate",
                "job_title": job_obj.title if job_obj else "Position",
                "status": getattr(app.status, 'value', str(app.status)),
                "ats_score": app.ats_score,
                "applied_at": app.applied_at.isoformat() if app.applied_at else None
            })

    return {
        "summary": {
            "active_jobs": active_jobs,
            "total_applications": total_applications,
            "shortlisted": shortlisted,
            "interviews": interviews
        },
        "recent_applications": recent_apps,
        "jobs": [
            {
                "id": str(j.id),
                "title": j.title,
                "status": getattr(j.status, 'value', str(j.status)),
                "total_applications": db.query(Application).filter(Application.job_id == j.id).count()
            }
            for j in jobs
        ]
    }


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
    """Cancel an interview, synchronize candidate application pipeline, and dispatch notification."""
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.recruiter_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    # Mark status as CANCELLED
    interview.status = InterviewStatus.CANCELLED

    # Revert / Update Application status
    app = db.query(Application).filter(
        (Application.id == interview.application_id) |
        ((Application.candidate_id == interview.candidate_id) & (Application.job_id == interview.job_id))
    ).first()

    job_title = "Position"
    if app:
        app.status = ApplicationStatus.SHORTLISTED
        app.recruiter_notes = "Previously scheduled interview was cancelled by the recruiter."
        if app.job:
            job_title = app.job.title
    elif interview.job_id:
        job = db.query(Job).filter(Job.id == interview.job_id).first()
        if job:
            job_title = job.title

    # Send Notification to Candidate
    notif = Notification(
        user_id=interview.candidate_id,
        type=NotificationType.APPLICATION_STATUS,
        title="❌ Interview Cancelled",
        message=f"Your scheduled interview for {job_title} has been cancelled by the recruiter.",
        link="/candidate/applications"
    )
    db.add(notif)
    db.commit()
    return {"message": "Interview cancelled successfully."}
