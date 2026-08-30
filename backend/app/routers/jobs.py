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
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db),
):
    """Search active jobs posted by recruiters in database."""
    q = db.query(Job).filter(Job.status == JobStatus.ACTIVE)
    if query:
        q = q.filter(
            (Job.title.ilike(f"%{query}%")) |
            (Job.description.ilike(f"%{query}%")) |
            (Job.company.ilike(f"%{query}%"))
        )
    if location:
        q = q.filter(Job.location.ilike(f"%{location}%"))
    if job_type:
        q = q.filter(Job.job_type == job_type)

    jobs = q.order_by(Job.created_at.desc()).limit(limit).all()

    formatted_jobs = []
    for j in jobs:
        salary_str = ""
        if j.salary_min and j.salary_max:
            salary_str = f"${j.salary_min:,} - ${j.salary_max:,} / year"
        elif j.salary_min:
            salary_str = f"From ${j.salary_min:,} / year"

        formatted_jobs.append({
            "id": str(j.id),
            "title": j.title,
            "company": j.company,
            "location": j.location or "Remote",
            "employment_type": j.job_type.value if hasattr(j.job_type, "value") else str(j.job_type or "Full-time"),
            "salary": salary_str,
            "salary_min": j.salary_min,
            "salary_max": j.salary_max,
            "description": j.description,
            "skills": j.required_skills or [],
            "posted_date": j.created_at.strftime("%d %b %Y") if j.created_at else "Recently",
            "is_remote": j.is_remote,
            "experience_level": j.experience_level.value if hasattr(j.experience_level, "value") else str(j.experience_level or "Mid-level"),
            "url": f"/candidate/jobs/{j.id}",
            "source": "Internal Recruiter Posting",
        })

    return {
        "status": "success",
        "provider": "Database Job Registry",
        "message": f"Found {len(formatted_jobs)} active openings.",
        "total": len(formatted_jobs),
        "jobs": formatted_jobs,
    }


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

    resume = None
    if app_data.resume_id:
        resume = db.query(Resume).filter(Resume.id == app_data.resume_id).first()
    if not resume:
        resume = db.query(Resume).filter(
            Resume.user_id == current_user.id,
            Resume.is_parsed == True
        ).order_by(Resume.created_at.desc()).first()
    if not resume:
        resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).first()

    parsed_resume = {
        "name": (resume.parsed_name if resume else None) or current_user.full_name,
        "summary": (resume.parsed_summary if resume else "") or (current_user.candidate_profile.headline or current_user.candidate_profile.summary if current_user.candidate_profile else "") or "",
        "skills": (resume.parsed_skills if resume else None) or (current_user.candidate_profile.skills if current_user.candidate_profile else []) or [],
        "experience": (resume.parsed_experience if resume else None) or [],
        "education": (resume.parsed_education if resume else None) or [],
        "certifications": (resume.parsed_certifications if resume else None) or [],
        "projects": (resume.parsed_projects if resume else None) or [],
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

    ats = (resume.ats_score if resume else 75.0) or 75.0
    semantic = match_result.get("semantic_score", 70.0)
    skills = match_result.get("skills_score", 70.0)
    overall = ats * 0.25 + semantic * 0.40 + skills * 0.35

    application = Application(
        candidate_id=current_user.id,
        job_id=job_id,
        resume_id=resume.id if resume else None,
        cover_letter=app_data.cover_letter or "Applied via Platform",
        ats_score=ats,
        semantic_match_score=semantic,
        skills_match_score=skills,
        overall_score=round(overall, 1),
        score_explanation=match_result.get("explanation", "Candidate application submitted."),
        matched_skills=match_result.get("matched_skills", []),
        missing_skills=match_result.get("missing_skills", []),
        status=ApplicationStatus.APPLIED
    )
    db.add(application)

    job.total_applications = (job.total_applications or 0) + 1
    db.commit()
    db.refresh(application)

    from app.services import evaluation_engine
    from app.routers.recruiter import _persist_candidate_score
    from app.routers.coding import sync_candidate_coding_stats

    sync_candidate_coding_stats(db, current_user.id)
    ev = evaluation_engine.evaluate_application(db, application, job)
    _persist_candidate_score(db, ev, job_id)
    db.commit()

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


@router.post("/{job_id}/analyze")
async def analyze_job_description(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    """Analyze job description to extract required skills, experience, education, responsibilities."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    from ml.preprocessing.job_parser import job_parser
    from app.models.ml_models import Skill, JobSkill

    parsed = job_parser.parse(job.description)
    
    # Update job properties in PostgreSQL
    job.min_experience_years = parsed.get("min_experience_years", job.min_experience_years)
    job.required_education = parsed.get("required_education", job.required_education)
    job.required_skills = list(set((job.required_skills or []) + parsed.get("required_skills", [])))
    db.commit()

    # Clear old job skills and populate job_skills table
    db.query(JobSkill).filter(JobSkill.job_id == job.id).delete()
    for sk_name in job.required_skills:
        # Check if skill exists in unified skills table, if not create one
        sk_rec = db.query(Skill).filter(Skill.canonical_name == sk_name).first()
        if not sk_rec:
            sk_rec = Skill(canonical_name=sk_name, source="job_extraction")
            db.add(sk_rec)
            db.commit()
            db.refresh(sk_rec)
        
        js = JobSkill(
            job_id=job.id,
            skill_id=sk_rec.id,
            skill_name=sk_name,
            importance="required",
            is_required=True,
            source="extracted"
        )
        db.add(js)
    db.commit()

    return {
        "job_title": job.title,
        "required_skills": job.required_skills,
        "preferred_skills": job.preferred_skills or [],
        "experience": job.min_experience_years,
        "education": job.required_education,
        "responsibilities": job.responsibilities or ""
    }


@router.get("/recommended")
async def get_recommended_jobs(
    limit: int = Query(10, le=50),
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db),
):
    """Get personalized humanized job recommendations for the candidate."""
    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id,
        Resume.is_parsed == True,
    ).order_by(Resume.created_at.desc()).first()

    if not resume:
        return []

    jobs = db.query(Job).filter(Job.status == JobStatus.ACTIVE).limit(100).all()
    
    parsed_resume = {
        "skills": resume.parsed_skills or [],
        "experience": resume.parsed_experience or [],
        "projects": resume.parsed_projects or [],
        "education": resume.parsed_education or [],
        "certifications": resume.parsed_certifications or [],
    }

    results = []
    from app.ai.ats_scorer import ats_scorer
    from app.models.ml_models import ResumeJobMatch

    for j in jobs:
        # Calculate Job Compatibility Match Score (Part 18 weights)
        match_info = ats_scorer.calculate_match_score(
            parsed_resume,
            job_description=j.description,
            required_skills=j.required_skills,
            preferred_skills=j.preferred_skills,
            min_experience_years=j.min_experience_years or 0,
            required_education=j.required_education
        )
        
        # Calculate Job-Specific ATS Score (Section 3 formula)
        ats_info = ats_scorer.score(
            parsed_resume,
            job_description=j.description,
            job_skills=j.required_skills
        )

        # Cache results in resume_job_matches table (Part 28)
        match_record = db.query(ResumeJobMatch).filter(
            ResumeJobMatch.resume_id == resume.id,
            ResumeJobMatch.job_id == j.id
        ).first()

        if not match_record:
            match_record = ResumeJobMatch(
                resume_id=resume.id,
                candidate_id=current_user.id,
                job_id=j.id
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
            Application.candidate_id == current_user.id,
            Application.job_id == j.id
        ).first()
        if application:
            app_status = application.status.value

        # Humanized reasons for recommendation (Part 42)
        matched_count = len(match_info["matched_skills"])
        total_count = len(match_info["matched_skills"]) + len(match_info["missing_skills"])
        reason = f"Recommended because your {', '.join(match_info['matched_skills'][:3])} skills strongly align with this role and your project experience is relevant."

        results.append({
            "job_id": str(j.id),
            "title": j.title,
            "company": j.company,
            "location": j.location,
            "fit_score": match_info["match_score"],
            "ats_score": ats_info["ats_score"],
            "matched_skills": match_info["matched_skills"],
            "missing_skills": match_info["missing_skills"],
            "experience_match": match_info["experience_match"],
            "project_match": match_info["project_match"],
            "reason": reason,
            "application_status": app_status
        })

    # Sort descending by match score
    results.sort(key=lambda x: x["fit_score"], reverse=True)
    return results[:limit]
