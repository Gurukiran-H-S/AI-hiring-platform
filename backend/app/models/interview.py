import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Enum, Integer, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.types import PortableUUID
import enum


class InterviewType(str, enum.Enum):
    PHONE = "phone"
    VIDEO = "video"
    IN_PERSON = "in_person"
    TECHNICAL = "technical"
    HR = "hr"
    PANEL = "panel"


class InterviewStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    NO_SHOW = "no_show"


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    application_id = Column(PortableUUID(), ForeignKey("applications.id"), nullable=False, index=True)
    job_id = Column(PortableUUID(), ForeignKey("jobs.id"), nullable=False, index=True)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    recruiter_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)

    interview_type = Column(Enum(InterviewType), default=InterviewType.VIDEO)
    status = Column(Enum(InterviewStatus), default=InterviewStatus.SCHEDULED)
    round_number = Column(Integer, default=1)
    title = Column(String(255), nullable=True, default="Interview Round")

    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    timezone = Column(String(50), default="UTC")

    # Meeting details
    meeting_link = Column(Text, nullable=True)  # Zoom/Meet link
    meeting_id = Column(String(255), nullable=True)
    meeting_password = Column(String(100), nullable=True)
    location = Column(Text, nullable=True)  # For in-person

    # Interviewers
    interviewers = Column(JSON, nullable=True, default=list)  # [{name, email, role}]

    # Feedback
    candidate_feedback = Column(Text, nullable=True)
    recruiter_feedback = Column(Text, nullable=True)
    technical_score = Column(Integer, nullable=True)  # 1-10
    communication_score = Column(Integer, nullable=True)
    overall_rating = Column(Integer, nullable=True)
    recommendation = Column(String(50), nullable=True)  # hire, reject, next_round

    # Notes & questions
    interview_questions = Column(JSON, nullable=True, default=list)
    notes = Column(Text, nullable=True)

    reminder_sent = Column(Boolean, default=False)
    email_notification_sent = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="interviews")
    job = relationship("Job", back_populates="interviews")
    candidate = relationship("User", back_populates="interviews_as_candidate", foreign_keys=[candidate_id])

    def __repr__(self):
        return f"<Interview {self.interview_type} on {self.scheduled_at}>"
