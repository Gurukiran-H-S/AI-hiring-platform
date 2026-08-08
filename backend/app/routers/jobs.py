"""Jobs router - Search, CRUD, AI matching, Save Jobs, Applications."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.models.job import Job, JobStatus
from app.models.user import User
from app.models.resume import Resume
from app.models.application import Application, ApplicationStatus
from app.schemas.job import JobCreate, JobUpdate, JobResponse, ApplicationCreate, ApplicationResponse, CandidateRankResponse
from app.middleware.auth_middleware import get_current_user, get_current_recruiter, get_current_candidate
from app.ai.semantic_matcher import semantic_matcher
from app.ai.candidate_ranker import candidate_ranker
from app.services.job_provider.external_provider import ExternalJobProvider

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])
external_job_provider = ExternalJobProvider()


@router.get("/search")
async def search_jobs(
    query: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    limit: int = Query(20, le=50)
):
    """Modular External/Demo Job Search API endpoint."""
    return external_job_provider.search_jobs(query, location, job_type, limit)


@router.get("/", response_model=List[JobResponse])
async def list_jobs(
    search: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    experience_level: Optional[str] = Query(None),
    is_remote: Optional[bool] = Query(None),
    min_salary: Optional[int] = Query(None),
    max_salary: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
):
    """List all active jobs with filtering and search."""
    query = db.query(Job).filter(Job.status == JobStatus.ACTIVE)

    if search:
        query = query.filter(
            (Job.title.ilike(f"%{search}%")) |
            (Job.description.ilike(f"%{search}%")) |
            (Job.company.ilike(f"%{search}%"))
        )
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
    if job_type:
        query = query.filter(Job.job_type == job_type)
    if experience_level:
        query = query.filter(Job.experience_level == experience_level)
    if is_remote is not None:
        query = query.filter(Job.is_remote == is_remote)
    if min_salary:
        query = query.filter(Job.salary_min >= min_salary)
    if max_salary:
        query = query.filter(Job.salary_max <= max_salary)

    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    return [JobResponse.from_orm(j) for j in jobs]


@router.post("/", response_model=JobResponse, status_code=201)
async def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Create a new job posting (recruiters only)."""
    job_text = f"{job_data.title} {job_data.description} {' '.join(job_data.required_skills)}"
    embedding = semantic_matcher.encode(job_text)

    job = Job(
        recruiter_id=current_user.id,
        description_embedding=embedding[:128],
        **job_data.dict(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return JobResponse.from_orm(job)


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: UUID, db: Session = Depends(get_db)):
    """Get job details by ID."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.views_count += 1
    db.commit()
    return JobResponse.from_orm(job)


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: UUID,
    job_data: JobUpdate,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Update a job posting."""
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    for field, value in job_data.dict(exclude_none=True).items():
        setattr(job, field, value)
    job.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    return JobResponse.from_orm(job)


@router.delete("/{job_id}", status_code=204)
async def delete_job(
    job_id: UUID,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Delete a job posting."""
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()


@router.post("/{job_id}/apply", response_model=ApplicationResponse, status_code=201)
async def apply_to_job(
    job_id: UUID,
    app_data: ApplicationCreate,
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db),
):
    """Apply to a job with a resume."""
    existing = db.query(Application).filter(
        Application.candidate_id == current_user.id,
        Application.job_id == job_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this job")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    resume = db.query(Resume).filter(Resume.id == app_data.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    parsed_resume = {
        "name": resume.parsed_name,
        "summary": resume.parsed_summary,
        "skills": resume.parsed_skills or [],
        "experience": resume.parsed_experience or [],
        "education": resume.parsed_education or [],
        "certifications": resume.parsed_certifications or [],
        "projects": resume.parsed_projects or [],
    }
    job_dict = {
        "title": job.title,
        "description": job.description,
        "required_skills": job.required_skills or [],
        "preferred_skills": job.preferred_skills or [],
        "min_experience_years": job.min_experience_years or 0,
        "required_education": job.required_education,
    }

    match_result = semantic_matcher.match_resume_to_job(parsed_resume, job_dict)

    ats = resume.ats_score or 0
    semantic = match_result["semantic_score"]
    skills = match_result["skills_score"]
    overall = ats * 0.25 + semantic * 0.40 + skills * 0.35

    application = Application(
        candidate_id=current_user.id,
        job_id=job_id,
        resume_id=app_data.resume_id,
        cover_letter=app_data.cover_letter,
        ats_score=ats,
        semantic_match_score=semantic,
        skills_match_score=skills,
        overall_score=round(overall, 1),
        score_explanation=match_result["explanation"],
        matched_skills=match_result["matched_skills"],
        missing_skills=match_result["missing_skills"],
        status=ApplicationStatus.APPLIED
    )
    db.add(application)

    job.total_applications += 1
    db.commit()
    db.refresh(application)

    return ApplicationResponse.from_orm(application)


@router.get("/recommend/me")
async def get_job_recommendations(
    limit: int = Query(10, le=50),
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db),
):
    """Get AI-powered job recommendations for the current candidate."""
    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id,
        Resume.is_parsed == True,
    ).order_by(Resume.created_at.desc()).first()

    if not resume:
        raise HTTPException(status_code=404, detail="No resume found. Please upload a resume first.")

    jobs = db.query(Job).filter(Job.status == JobStatus.ACTIVE).limit(100).all()
    if not jobs:
        return []

    resume_data = {
        "summary": resume.parsed_summary or "",
        "skills": resume.parsed_skills or [],
        "experience": resume.parsed_experience or [],
        "education": resume.parsed_education or [],
        "certifications": resume.parsed_certifications or [],
    }
    jobs_data = [
        {
            "id": str(j.id),
            "title": j.title,
            "company": j.company,
            "location": j.location,
            "description": j.description,
            "required_skills": j.required_skills or [],
            "preferred_skills": j.preferred_skills or [],
            "description_embedding": j.description_embedding,
            "salary_min": j.salary_min,
            "salary_max": j.salary_max,
            "is_remote": j.is_remote,
            "job_type": j.job_type.value,
        }
        for j in jobs
    ]

    recommendations = semantic_matcher.batch_match_jobs(resume_data, jobs_data, top_k=limit)
    return recommendations
