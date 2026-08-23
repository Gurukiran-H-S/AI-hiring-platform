import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum, Text, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.types import PortableUUID
import enum


class UserRole(str, enum.Enum):
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CANDIDATE)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    profile_picture_url = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    location = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    candidate_profile = relationship("CandidateProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    recruiter_profile = relationship("RecruiterProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="candidate", foreign_keys="Application.candidate_id", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    interviews_as_candidate = relationship("Interview", back_populates="candidate", foreign_keys="Interview.candidate_id")

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"


class EmailVerification(Base):
    __tablename__ = "email_verifications"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), index=True, nullable=False)
    otp_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    headline = Column(String(255), nullable=True)
    summary = Column(Text, nullable=True)
    skills = Column(JSON, nullable=True, default=list)            # ["Python", "React", ...]
    education = Column(JSON, nullable=True, default=list)         # [{degree, college, university, year, cgpa}]
    experience = Column(JSON, nullable=True, default=list)        # [{company, role, start_date, end_date, description}]
    projects = Column(JSON, nullable=True, default=list)          # [{name, description, technologies, github_url, live_demo_url}]
    certifications = Column(JSON, nullable=True, default=list)    # [{name, issuing_organization, date, credential_url}]
    
    # Preferences
    preferred_role = Column(String(255), nullable=True)
    preferred_location = Column(String(255), nullable=True)
    work_mode = Column(String(50), nullable=True)                 # "Remote", "Hybrid", "On-site"
    salary_expectation = Column(String(50), nullable=True)
    preferred_job_type = Column(String(50), nullable=True)        # "Full-time", "Internship", "Part-time"
    preferred_industries = Column(JSON, nullable=True, default=list)
    
    # Social / Professional Links
    github_url = Column(String(500), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    portfolio_url = Column(String(500), nullable=True)
    leetcode_url = Column(String(500), nullable=True)
    
    # Completion
    profile_completion = Column(Integer, default=0)

    # Legacy fields
    years_of_experience = Column(String(20), nullable=True)
    current_salary = Column(String(50), nullable=True)
    expected_salary = Column(String(50), nullable=True)
    notice_period = Column(String(50), nullable=True)
    job_type_preference = Column(String(50), nullable=True)
    availability = Column(String(50), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="candidate_profile")


class RecruiterProfile(Base):
    __tablename__ = "recruiter_profiles"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    company_name = Column(String(255), nullable=True)
    company_website = Column(String(500), nullable=True)
    company_logo_url = Column(Text, nullable=True)
    industry = Column(String(100), nullable=True)
    company_size = Column(String(50), nullable=True)
    company_description = Column(Text, nullable=True)
    designation = Column(String(255), nullable=True)
    department = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="recruiter_profile")
    jobs = relationship(
        "Job",
        back_populates="recruiter",
        primaryjoin="RecruiterProfile.user_id == Job.recruiter_id",
        foreign_keys="[Job.recruiter_id]",
    )
