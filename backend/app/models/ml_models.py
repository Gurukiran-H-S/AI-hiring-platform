import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.types import PortableUUID


class Skill(Base):
    """Unified master skill table mapping to ESCO & O*NET."""
    __tablename__ = "skills"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    canonical_name = Column(String(255), unique=True, index=True, nullable=False)
    category = Column(String(255), nullable=True)
    subcategory = Column(String(255), nullable=True)
    esco_id = Column(String(255), nullable=True, index=True)
    onet_id = Column(String(255), nullable=True, index=True)
    source = Column(String(50), default="unified")  # esco, onet, manual, resume, job
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    aliases = relationship("SkillAlias", back_populates="skill", cascade="all, delete-orphan")


class SkillAlias(Base):
    """Synonyms and variations of canonical skills."""
    __tablename__ = "skill_aliases"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    skill_id = Column(PortableUUID(), ForeignKey("skills.id"), nullable=False, index=True)
    alias = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    skill = relationship("Skill", back_populates="aliases")


class Occupation(Base):
    """Occupations taxonomy mapping to ESCO & O*NET."""
    __tablename__ = "occupations"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, index=True, nullable=False)
    esco_id = Column(String(255), nullable=True, index=True)
    onet_id = Column(String(255), nullable=True, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class OccupationSkill(Base):
    """Occupation to Skill mapping (essential vs optional)."""
    __tablename__ = "occupation_skills"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    occupation_id = Column(PortableUUID(), ForeignKey("occupations.id"), nullable=False, index=True)
    skill_id = Column(PortableUUID(), ForeignKey("skills.id"), nullable=False, index=True)
    relation_type = Column(String(50), default="essential")  # essential, optional
    created_at = Column(DateTime, default=datetime.utcnow)


class CandidateSkill(Base):
    """Unified candidate skills matching system."""
    __tablename__ = "candidate_skills"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    resume_id = Column(PortableUUID(), ForeignKey("resumes.id"), nullable=True, index=True)
    skill_id = Column(PortableUUID(), ForeignKey("skills.id"), nullable=False, index=True)
    skill_name = Column(String(255), nullable=True)
    proficiency = Column(String(50), default="intermediate")
    source = Column(String(50), default="resume")  # resume, coding, aptitude, interview
    confidence = Column(Float, default=0.80)
    created_at = Column(DateTime, default=datetime.utcnow)


class JobSkill(Base):
    """Skills required/preferred for jobs."""
    __tablename__ = "job_skills"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    job_id = Column(PortableUUID(), ForeignKey("jobs.id"), nullable=False, index=True)
    skill_id = Column(PortableUUID(), ForeignKey("skills.id"), nullable=False, index=True)
    skill_name = Column(String(255), nullable=True)
    importance = Column(String(50), default="required")  # required, preferred
    is_required = Column(Boolean, default=True)
    source = Column(String(50), default="extracted")
    created_at = Column(DateTime, default=datetime.utcnow)


class ResumeJobMatch(Base):
    """Cached matching results between candidate resumes and recruiter jobs."""
    __tablename__ = "resume_job_matches"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    resume_id = Column(PortableUUID(), ForeignKey("resumes.id"), nullable=False, index=True)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(PortableUUID(), ForeignKey("jobs.id"), nullable=False, index=True)
    
    ats_score = Column(Float, default=0.0)
    match_score = Column(Float, default=0.0)
    
    skill_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    semantic_score = Column(Float, default=0.0)
    project_score = Column(Float, default=0.0)
    education_score = Column(Float, default=0.0)
    
    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    partial_skills = Column(JSON, default=list)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CandidateFeedback(Base):
    """Database containing real feedback on recruiter hiring outcomes."""
    __tablename__ = "candidate_feedback"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(PortableUUID(), ForeignKey("jobs.id"), nullable=False, index=True)
    
    ats_score = Column(Float, default=0.0)
    skill_score = Column(Float, default=0.0)
    keyword_score = Column(Float, default=0.0)
    semantic_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    education_score = Column(Float, default=0.0)
    project_score = Column(Float, default=0.0)
    coding_score = Column(Float, default=0.0)
    aptitude_score = Column(Float, default=0.0)
    interview_score = Column(Float, default=0.0)
    
    selected = Column(Boolean, default=False)  # Target label for XGBoost candidate ranking
    recruiter_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ModelVersion(Base):
    """Keeps track of registered ML model versions and statistics."""
    __tablename__ = "model_versions"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    version = Column(String(50), nullable=False)
    dataset = Column(String(255), nullable=True)
    training_date = Column(DateTime, default=datetime.utcnow)
    metrics = Column(JSON, default=dict)
    model_path = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)


class ForecastResult(Base):
    """Time-series demand predictions for skills & occupations."""
    __tablename__ = "forecast_results"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    skill_name = Column(String(255), nullable=False, index=True)
    month = Column(String(20), nullable=False)  # YYYY-MM
    current_demand = Column(Float, default=0.0)
    predicted_demand = Column(Float, default=0.0)
    growth_rate = Column(Float, default=0.0)
    confidence_interval_lower = Column(Float, default=0.0)
    confidence_interval_upper = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
