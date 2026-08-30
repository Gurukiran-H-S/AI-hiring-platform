import uuid
from datetime import datetime
from sqlalchemy import Column, Float, ForeignKey, Integer, DateTime, String, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.types import PortableUUID


class AptitudeAssessment(Base):
    __tablename__ = "aptitude_assessments"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    job_id = Column(PortableUUID(), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    recruiter_id = Column(PortableUUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    status = Column(String(50), default="DRAFT", nullable=False)  # DRAFT, PUBLISHED, ACTIVE, CLOSED, ARCHIVED
    password_hash = Column(String(255), nullable=False)

    duration_seconds = Column(Integer, default=1800, nullable=False)  # 30 mins default
    total_marks = Column(Float, default=80.0, nullable=False)
    passing_score = Column(Float, default=60.0, nullable=False)  # percentage
    negative_marking = Column(Float, default=0.5, nullable=False)

    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    max_attempts = Column(Integer, default=1, nullable=False)
    shuffle_questions = Column(Boolean, default=True, nullable=False)
    shuffle_options = Column(Boolean, default=True, nullable=False)
    show_correct_answers_after_submission = Column(Boolean, default=False, nullable=False)
    version = Column(Integer, default=1, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    published_at = Column(DateTime, nullable=True)

    # Relationships
    questions = relationship("AssessmentQuestion", back_populates="assessment", cascade="all, delete-orphan", order_by="AssessmentQuestion.question_order")
    launch_codes = relationship("AssessmentLaunchCode", back_populates="assessment", cascade="all, delete-orphan")
    attempts = relationship("AssessmentAttempt", back_populates="assessment", cascade="all, delete-orphan")


class AssessmentQuestion(Base):
    __tablename__ = "aptitude_assessment_questions"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(PortableUUID(), ForeignKey("aptitude_assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(100), nullable=True)  # Source bank ID if any
    question_order = Column(Integer, default=0, nullable=False)

    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # ["Option A", "Option B", "Option C", "Option D"]
    correct_answer = Column(String(255), nullable=False)  # e.g. "0", "1", "2", "3" or text
    marks = Column(Float, default=2.0, nullable=False)
    negative_marks = Column(Float, default=0.5, nullable=False)
    category = Column(String(100), default="General Ability", nullable=False)
    difficulty = Column(String(50), default="Medium", nullable=False)  # Easy, Medium, Hard
    explanation = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    assessment = relationship("AptitudeAssessment", back_populates="questions")


class AssessmentLaunchCode(Base):
    __tablename__ = "aptitude_launch_codes"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(PortableUUID(), ForeignKey("aptitude_assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(PortableUUID(), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)

    code = Column(String(50), nullable=False, index=True)  # e.g. "847291"
    code_hash = Column(String(255), nullable=True)
    valid_from = Column(DateTime, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, EXPIRED, REVOKED

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    assessment = relationship("AptitudeAssessment", back_populates="launch_codes")


class AssessmentAttempt(Base):
    __tablename__ = "aptitude_attempts"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(PortableUUID(), ForeignKey("aptitude_assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_version = Column(Integer, default=1, nullable=False)
    job_id = Column(PortableUUID(), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    recruiter_id = Column(PortableUUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id = Column(PortableUUID(), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)

    attempt_number = Column(Integer, default=1, nullable=False)
    status = Column(String(50), default="IN_PROGRESS", nullable=False)  # IN_PROGRESS, SUBMITTED, AUTO_SUBMITTED, EXPIRED
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    submitted_at = Column(DateTime, nullable=True)

    score = Column(Float, nullable=True)  # Earned score
    total_marks = Column(Float, nullable=True)  # Max possible score
    percentage = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    correct_count = Column(Integer, default=0, nullable=False)
    wrong_count = Column(Integer, default=0, nullable=False)
    unanswered_count = Column(Integer, default=0, nullable=False)
    time_taken = Column(Integer, nullable=True)  # in seconds

    section_breakdown = Column(JSON, nullable=True)  # {"Quantitative": {"score": 10, "percentage": 80}, ...}
    question_order = Column(JSON, nullable=True)  # ["uuid1", "uuid2", ...]

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    assessment = relationship("AptitudeAssessment", back_populates="attempts")
    answers = relationship("AssessmentAnswer", back_populates="attempt", cascade="all, delete-orphan")


class AssessmentAnswer(Base):
    __tablename__ = "aptitude_attempt_answers"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    attempt_id = Column(PortableUUID(), ForeignKey("aptitude_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(PortableUUID(), ForeignKey("aptitude_assessment_questions.id", ondelete="CASCADE"), nullable=False, index=True)

    selected_answer = Column(String(255), nullable=True)
    is_correct = Column(Boolean, nullable=True)
    marks_awarded = Column(Float, default=0.0, nullable=False)
    answered_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    attempt = relationship("AssessmentAttempt", back_populates="answers")


class AptitudeScore(Base):
    """Legacy model maintained for candidate general practice assessments."""
    __tablename__ = "aptitude_scores"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assessment_id = Column(String(100), nullable=False, default="TCS_NQT_SET_A")
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    percentage = Column(Float, nullable=False)
    percentile = Column(Float, nullable=True)
    taken_at = Column(DateTime, default=datetime.utcnow)
