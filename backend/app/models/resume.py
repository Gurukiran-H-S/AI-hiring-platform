import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.types import PortableUUID


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=True, default="My Resume")
    file_url = Column(Text, nullable=True)  # Cloudinary URL
    file_name = Column(String(255), nullable=True)
    file_type = Column(String(255), nullable=True)
    is_primary = Column(Boolean, default=False)
    is_parsed = Column(Boolean, default=False)
    ats_status = Column(String(50), default="PENDING")  # PENDING, PROCESSING, COMPLETED, FAILED

    # Parsed AI Fields (JSON for flexible storage)
    raw_text = Column(Text, nullable=True)
    parsed_name = Column(String(255), nullable=True)
    parsed_email = Column(String(255), nullable=True)
    parsed_phone = Column(String(255), nullable=True)
    parsed_location = Column(String(255), nullable=True)
    parsed_summary = Column(Text, nullable=True)
    parsed_skills = Column(JSON, nullable=True, default=list)      # ["Python", "FastAPI", ...]
    parsed_education = Column(JSON, nullable=True, default=list)   # [{degree, institution, year}]
    parsed_experience = Column(JSON, nullable=True, default=list)  # [{title, company, duration, desc}]
    parsed_certifications = Column(JSON, nullable=True, default=list)  # [{name, issuer, year}]
    parsed_projects = Column(JSON, nullable=True, default=list)    # [{name, desc, tech}]
    parsed_languages = Column(JSON, nullable=True, default=list)

    # ATS Analysis
    ats_score = Column(Float, nullable=True)
    ats_breakdown = Column(JSON, nullable=True)  # {formatting, keywords, sections, readability}
    quality_score = Column(Float, nullable=True)
    improvement_suggestions = Column(JSON, nullable=True, default=list)
    keywords_found = Column(JSON, nullable=True, default=list)
    keywords_missing = Column(JSON, nullable=True, default=list)

    # Resume embedding for semantic matching
    embedding_vector = Column(JSON, nullable=True)  # Stored as list of floats

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    parsed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="resumes")
    applications = relationship("Application", back_populates="resume")

    def __repr__(self):
        return f"<Resume {self.title} (ATS: {self.ats_score})>"
