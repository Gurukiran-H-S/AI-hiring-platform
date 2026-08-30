from pydantic import BaseModel
from typing import Optional, List, Dict
from uuid import UUID
from datetime import datetime
from app.models.job import JobType, ExperienceLevel, JobStatus


class JobCreate(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    is_remote: bool = False
    job_type: JobType = JobType.FULL_TIME
    experience_level: ExperienceLevel = ExperienceLevel.MID
    description: str
    responsibilities: List[str] = []
    requirements: List[str] = []
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    required_education: Optional[str] = None
    min_experience_years: int = 0
    max_experience_years: Optional[int] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: str = "USD"
    benefits: List[str] = []
    application_deadline: Optional[datetime] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    location: Optional[str] = None
    is_remote: Optional[bool] = None
    job_type: Optional[JobType] = None
    experience_level: Optional[ExperienceLevel] = None
    description: Optional[str] = None
    responsibilities: Optional[List[str]] = None
    requirements: Optional[List[str]] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    status: Optional[JobStatus] = None


class JobResponse(BaseModel):
    id: UUID
    recruiter_id: UUID
    title: str
    company: str
    company_logo_url: Optional[str]
    location: Optional[str]
    is_remote: bool
    job_type: JobType
    experience_level: ExperienceLevel
    status: JobStatus
    description: str
    responsibilities: Optional[List[str]] = []
    requirements: Optional[List[str]] = []
    required_skills: Optional[List[str]] = []
    preferred_skills: Optional[List[str]] = []
    required_education: Optional[str]
    min_experience_years: int
    max_experience_years: Optional[int]
    salary_min: Optional[int]
    salary_max: Optional[int]
    currency: str
    benefits: Optional[List[str]] = []
    total_applications: int
    views_count: int
    created_at: datetime
    application_deadline: Optional[datetime]

    class Config:
        from_attributes = True


class ApplicationCreate(BaseModel):
    job_id: Optional[UUID] = None
    resume_id: Optional[UUID] = None
    cover_letter: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: UUID
    candidate_id: UUID
    job_id: UUID
    resume_id: Optional[UUID]
    status: str
    cover_letter: Optional[str]
    ats_score: Optional[float]
    semantic_match_score: Optional[float]
    overall_score: Optional[float]
    matched_skills: Optional[List[str]] = []
    missing_skills: Optional[List[str]] = []
    score_explanation: Optional[Dict]
    is_shortlisted: bool
    applied_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CandidateRankResponse(BaseModel):
    rank: int
    candidate_id: UUID
    candidate_name: str
    candidate_email: str
    resume_id: Optional[UUID]
    overall_score: float
    ats_score: Optional[float]
    semantic_match_score: Optional[float]
    skills_match_score: Optional[float]
    matched_skills: List[str]
    missing_skills: List[str]
    years_of_experience: Optional[str]
    explanation: Dict
    application_status: str
