import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Enum, Integer, Float, JSON
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


# ─── AI MOCK INTERVIEW MODELS ────────────────────────────────────────────────

class MockInterview(Base):
    __tablename__ = "mock_interviews"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(PortableUUID(), ForeignKey("jobs.id"), nullable=True, index=True)

    role_title = Column(String(255), nullable=False, default="Software Engineer")
    interview_type = Column(String(50), nullable=False, default="Technical")  # Technical, HR, Behavioral, Mixed
    status = Column(String(50), nullable=False, default="in_progress")  # in_progress, completed, cancelled

    total_questions = Column(Integer, default=5)
    completed_questions = Column(Integer, default=0)

    final_score = Column(Float, nullable=True)  # 0 - 100
    technical_score = Column(Float, nullable=True)
    coverage_score = Column(Float, nullable=True)
    relevance_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)

    strengths = Column(JSON, nullable=True, default=list)  # List of strength bullet strings
    improvements = Column(JSON, nullable=True, default=list)  # List of improvement bullet strings
    missing_topics = Column(JSON, nullable=True, default=list)  # List of unmentioned topic strings

    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    candidate = relationship("User", foreign_keys=[candidate_id])
    job = relationship("Job", foreign_keys=[job_id])
    questions = relationship("MockInterviewQuestion", back_populates="interview", cascade="all, delete-orphan", order_by="MockInterviewQuestion.question_number")
    responses = relationship("MockInterviewResponse", back_populates="interview", cascade="all, delete-orphan")


class MockInterviewQuestion(Base):
    __tablename__ = "mock_interview_questions"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    interview_id = Column(PortableUUID(), ForeignKey("mock_interviews.id"), nullable=False, index=True)
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="Technical")  # Technical, Behavioral, HR, Situational, Project-based
    category = Column(String(100), default="Core Concepts")
    difficulty = Column(String(50), default="Medium")
    expected_points = Column(JSON, nullable=False, default=list)  # [{"id": 1, "point": "...", "weight": 1.0}]
    created_at = Column(DateTime, default=datetime.utcnow)

    interview = relationship("MockInterview", back_populates="questions")
    responses = relationship("MockInterviewResponse", back_populates="question", cascade="all, delete-orphan")


class MockInterviewResponse(Base):
    __tablename__ = "mock_interview_responses"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    interview_id = Column(PortableUUID(), ForeignKey("mock_interviews.id"), nullable=False, index=True)
    question_id = Column(PortableUUID(), ForeignKey("mock_interview_questions.id"), nullable=False, index=True)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)

    transcript = Column(Text, nullable=False, default="")
    duration_seconds = Column(Integer, default=0)
    answer_score = Column(Float, default=0.0)  # 0 - 100
    coverage_score = Column(Float, default=0.0)  # 0 - 100
    semantic_score = Column(Float, default=0.0)  # 0 - 100
    filler_words_count = Column(Integer, default=0)

    # Point results: [{"expected_point": "...", "matched": true, "confidence": 0.95, "evidence_text": "..."}]
    point_results = Column(JSON, nullable=False, default=list)
    response_status = Column(String(50), default="COMPLETED")  # COMPLETED, NO_SPEECH, TRANSCRIPTION_FAILED

    created_at = Column(DateTime, default=datetime.utcnow)

    interview = relationship("MockInterview", back_populates="responses")
    question = relationship("MockInterviewQuestion", back_populates="responses")
    candidate = relationship("User", foreign_keys=[candidate_id])

