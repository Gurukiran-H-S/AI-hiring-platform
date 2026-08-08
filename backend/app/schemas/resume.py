from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from uuid import UUID
from datetime import datetime


class ResumeResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: Optional[str]
    file_url: Optional[str]
    file_name: Optional[str]
    is_primary: bool
    is_parsed: bool
    parsed_name: Optional[str]
    parsed_email: Optional[str]
    parsed_phone: Optional[str]
    parsed_location: Optional[str]
    parsed_summary: Optional[str]
    parsed_skills: Optional[List[str]] = []
    parsed_education: Optional[List[Dict]] = []
    parsed_experience: Optional[List[Dict]] = []
    parsed_certifications: Optional[List[Dict]] = []
    parsed_projects: Optional[List[Dict]] = []
    ats_score: Optional[float]
    ats_breakdown: Optional[Dict]
    quality_score: Optional[float]
    improvement_suggestions: Optional[List[str]] = []
    keywords_found: Optional[List[str]] = []
    keywords_missing: Optional[List[str]] = []
    created_at: datetime
    parsed_at: Optional[datetime]

    class Config:
        from_attributes = True


class ATSScoreResponse(BaseModel):
    resume_id: UUID
    overall_score: float
    grade: str  # A, B, C, D
    breakdown: Dict[str, Any]
    improvement_suggestions: List[str]
    keywords_found: List[str]
    keywords_missing: List[str]
    strengths: List[str]
    weaknesses: List[str]


class ResumeBuilderData(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    summary: Optional[str] = None
    skills: List[str] = []
    experience: List[Dict] = []
    education: List[Dict] = []
    certifications: List[Dict] = []
    projects: List[Dict] = []
    languages: List[Dict] = []
    template: str = "modern"


class JobMatchResponse(BaseModel):
    job_id: UUID
    job_title: str
    company: str
    semantic_score: float
    skills_match_score: float
    overall_match: float
    matched_skills: List[str]
    missing_skills: List[str]
    match_explanation: str
