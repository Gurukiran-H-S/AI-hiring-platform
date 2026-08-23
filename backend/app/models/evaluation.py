import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.types import PortableUUID


class EvaluationWeight(Base):
    """Job-specific evaluation weights (Must sum to 100%)."""
    __tablename__ = "evaluation_weights"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    job_id = Column(PortableUUID(), ForeignKey("jobs.id"), unique=True, nullable=False, index=True)
    ats_weight = Column(Float, default=0.30)        # 30%
    coding_weight = Column(Float, default=0.40)     # 40%
    skill_weight = Column(Float, default=0.20)      # 20%
    interview_weight = Column(Float, default=0.10)  # 10%
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    job = relationship("Job")


class CandidateScore(Base):
    """Calculated overall and sub-scores for a candidate per job."""
    __tablename__ = "candidate_scores"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(PortableUUID(), ForeignKey("jobs.id"), nullable=False, index=True)
    
    ats_score = Column(Float, default=0.0)
    coding_score = Column(Float, default=0.0)
    skill_match_score = Column(Float, default=0.0)
    interview_score = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0)

    ats_weight = Column(Float, default=0.30)
    coding_weight = Column(Float, default=0.40)
    skill_weight = Column(Float, default=0.20)
    interview_weight = Column(Float, default=0.10)

    match_level = Column(String(50), default="Potential Match") # Strong Match, Potential Match, Needs Review, Low Match
    recommendation_summary = Column(Text, nullable=True)
    mismatch_warning = Column(Text, nullable=True)

    calculated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    candidate = relationship("User")
    job = relationship("Job")


class CandidateSkillEvaluation(Base):
    """Tracks verified vs self-reported candidate skills."""
    __tablename__ = "candidate_skill_evaluations"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(PortableUUID(), ForeignKey("jobs.id"), nullable=True, index=True)
    skill_name = Column(String(100), nullable=False)
    candidate_level = Column(String(50), default="Intermediate")
    source = Column(String(50), default="resume") # resume, coding, assessment, interview
    is_verified = Column(Boolean, default=False)
    confidence_score = Column(Float, default=0.80)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("User")
    job = relationship("Job")

class WeightAuditLog(Base):
    """Audit trail for recruiter weight configuration changes."""
    __tablename__ = "weight_audit_logs"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    recruiter_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(PortableUUID(), ForeignKey("jobs.id"), nullable=False, index=True)
    old_weights = Column(JSON, nullable=True)
    new_weights = Column(JSON, nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow)
