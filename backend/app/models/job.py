import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, Integer, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.types import PortableUUID
import enum


class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"


class JobType(str, enum.Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    FREELANCE = "freelance"
    REMOTE = "remote"


class ExperienceLevel(str, enum.Enum):
    ENTRY = "entry"
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    EXECUTIVE = "executive"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    recruiter_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    company_logo_url = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    is_remote = Column(Boolean, default=False)
    is_demo = Column(Boolean, default=False)
    job_type = Column(Enum(JobType), default=JobType.FULL_TIME)
    experience_level = Column(Enum(ExperienceLevel), default=ExperienceLevel.MID)
    status = Column(Enum(JobStatus), default=JobStatus.ACTIVE)

    description = Column(Text, nullable=False)
    responsibilities = Column(JSON, nullable=True, default=list)
    requirements = Column(JSON, nullable=True, default=list)

    # AI-structured fields
    required_skills = Column(JSON, nullable=True, default=list)   # ["Python", "Docker"]
    preferred_skills = Column(JSON, nullable=True, default=list)
    required_education = Column(String(255), nullable=True)
    min_experience_years = Column(Integer, default=0)
    max_experience_years = Column(Integer, nullable=True)

    # Compensation
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    currency = Column(String(10), default="USD")
    benefits = Column(JSON, nullable=True, default=list)

    # Application settings
    application_deadline = Column(DateTime, nullable=True)
    max_applicants = Column(Integer, nullable=True)
    total_applications = Column(Integer, default=0)

    # AI embedding for semantic matching
    description_embedding = Column(JSON, nullable=True)

    # Analytics
    views_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    # Relationships
    recruiter = relationship(
        "RecruiterProfile",
        back_populates="jobs",
        primaryjoin="Job.recruiter_id == RecruiterProfile.user_id",
        foreign_keys=[recruiter_id],
    )
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="job")

    def __repr__(self):
        return f"<Job {self.title} at {self.company}>"
