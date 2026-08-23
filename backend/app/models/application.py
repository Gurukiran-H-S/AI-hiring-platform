import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, Integer, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.types import PortableUUID
import enum


class ApplicationStatus(str, enum.Enum):
    APPLIED = "applied"
    UNDER_REVIEW = "under_review"
    SHORTLISTED = "shortlisted"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEWED = "interviewed"
    OFFERED = "offered"
    HIRED = "hired"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class Application(Base):
    __tablename__ = "applications"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(PortableUUID(), ForeignKey("jobs.id"), nullable=False, index=True)
    resume_id = Column(PortableUUID(), ForeignKey("resumes.id"), nullable=True)

    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.APPLIED)
    cover_letter = Column(Text, nullable=True)

    # AI Scores
    ats_score = Column(Float, nullable=True)
    semantic_match_score = Column(Float, nullable=True)
    skills_match_score = Column(Float, nullable=True)
    experience_match_score = Column(Float, nullable=True)
    overall_score = Column(Float, nullable=True)

    # Explainable AI breakdown
    score_explanation = Column(JSON, nullable=True)
    matched_skills = Column(JSON, nullable=True, default=list)
    missing_skills = Column(JSON, nullable=True, default=list)
    rank_in_job = Column(Integer, nullable=True)

    # Recruiter notes
    recruiter_notes = Column(Text, nullable=True)
    is_shortlisted = Column(Boolean, default=False)
    is_starred = Column(Boolean, default=False)

    applied_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    candidate = relationship("User", back_populates="applications", foreign_keys=[candidate_id])
    job = relationship("Job", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")
    interviews = relationship("Interview", back_populates="application", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Application {self.candidate_id} -> {self.job_id} [{self.status}]>"


class SkillAssessment(Base):
    __tablename__ = "skill_assessments"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(PortableUUID(), ForeignKey("jobs.id"), nullable=True)

    candidate_skills = Column(JSON, nullable=True, default=list)
    required_skills = Column(JSON, nullable=True, default=list)
    matched_skills = Column(JSON, nullable=True, default=list)
    missing_skills = Column(JSON, nullable=True, default=list)
    gap_percentage = Column(Float, nullable=True)
    recommendations = Column(JSON, nullable=True, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)


class CourseRecommendation(Base):
    __tablename__ = "course_recommendations"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    skill_gap_id = Column(PortableUUID(), ForeignKey("skill_assessments.id"), nullable=True)

    course_title = Column(String(255), nullable=False)
    course_provider = Column(String(100), nullable=True)
    course_url = Column(Text, nullable=True)
    skill_targeted = Column(String(100), nullable=True)
    difficulty_level = Column(String(50), nullable=True)
    estimated_duration = Column(String(50), nullable=True)
    rating = Column(Float, nullable=True)
    is_free = Column(Boolean, default=False)
    relevance_score = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class LearningResource(Base):
    __tablename__ = "learning_resources"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    skill = Column(String(100), index=True, nullable=False)
    platform = Column(String(100), nullable=False)
    course_name = Column(String(255), nullable=False)
    url = Column(Text, nullable=False)
    level = Column(String(50), default="Beginner")
    free_or_paid = Column(String(20), default="Free")
    description = Column(Text, nullable=True)


class OfferLetter(Base):
    __tablename__ = "offer_letters"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    application_id = Column(PortableUUID(), ForeignKey("applications.id"), nullable=False, index=True)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    recruiter_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(PortableUUID(), ForeignKey("jobs.id"), nullable=False, index=True)

    job_title = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=True)
    salary_offered = Column(String(100), nullable=False)
    joining_date = Column(String(100), nullable=False)
    department = Column(String(100), nullable=True, default="Engineering")
    location_type = Column(String(50), nullable=True, default="Remote")
    benefits = Column(Text, nullable=True)
    letter_body = Column(Text, nullable=True)
    status = Column(String(50), default="sent")  # sent, accepted, declined, withdrawn

    sent_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)
    candidate_signature = Column(String(255), nullable=True)

    # Relationships
    application = relationship("Application", backref="offer_letters")
    candidate = relationship("User", foreign_keys=[candidate_id])
    recruiter = relationship("User", foreign_keys=[recruiter_id])
    job = relationship("Job", foreign_keys=[job_id])
