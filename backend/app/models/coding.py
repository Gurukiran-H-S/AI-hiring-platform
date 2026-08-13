import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, Integer, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.types import PortableUUID
import enum


class ProblemDifficulty(str, enum.Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"


class SubmissionStatus(str, enum.Enum):
    ACCEPTED = "Accepted"
    WRONG_ANSWER = "Wrong Answer"
    COMPILATION_ERROR = "Compilation Error"
    RUNTIME_ERROR = "Runtime Error"
    TIME_LIMIT_EXCEEDED = "Time Limit Exceeded"
    MEMORY_LIMIT_EXCEEDED = "Memory Limit Exceeded"
    PRESENTATION_ERROR = "Presentation Error"
    INTERNAL_ERROR = "Internal Error"
    PENDING = "Pending"


class Language(Base):
    __tablename__ = "coding_languages"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)  # e.g. "python", "cpp", "java", "javascript"
    display_name = Column(String(50), nullable=False)       # e.g. "Python 3", "C++ (GCC)", "Java 17", "JavaScript (Node)"
    judge0_language_id = Column(Integer, nullable=False)    # e.g. 71 for Python 3, 54 for C++, 62 for Java, 63 for JS
    file_extension = Column(String(10), nullable=False)
    is_active = Column(Boolean, default=True)


class CodingProblem(Base):
    __tablename__ = "coding_problems"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    problem_code = Column(String(50), unique=True, index=True, nullable=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(Enum(ProblemDifficulty), default=ProblemDifficulty.EASY, index=True)
    category = Column(String(100), default="Arrays", index=True)
    tags = Column(JSON, default=list)
    constraints = Column(Text, nullable=True)
    sample_input = Column(Text, nullable=True)
    sample_output = Column(Text, nullable=True)

    # LeetCode Driver Template fields
    function_name = Column(String(100), default="twoSum")
    input_schema = Column(JSON, nullable=True)   # ["nums: list", "target: int"]
    output_schema = Column(String(100), nullable=True) # "list"

    driver_template_python = Column(Text, nullable=True)
    driver_template_javascript = Column(Text, nullable=True)
    driver_template_cpp = Column(Text, nullable=True)
    driver_template_java = Column(Text, nullable=True)

    time_limit_seconds = Column(Float, default=2.0)
    memory_limit_mb = Column(Integer, default=256)
    reference_solution = Column(JSON, nullable=True)
    acceptance_rate = Column(Float, default=0.0)
    total_submissions = Column(Integer, default=0)
    total_accepted = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    test_cases = relationship("TestCase", back_populates="problem", cascade="all, delete-orphan")
    submissions = relationship("CandidateSubmission", back_populates="problem")


class TestCase(Base):
    __tablename__ = "problem_test_cases"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    problem_id = Column(PortableUUID(), ForeignKey("coding_problems.id"), nullable=False, index=True)
    input_data = Column(Text, nullable=False)        # Raw input string e.g. "[2,7,11,15]\n9"
    expected_output = Column(Text, nullable=False)   # Expected output string e.g. "[0, 1]"
    is_hidden = Column(Boolean, default=True)
    explanation = Column(Text, nullable=True)

    problem = relationship("CodingProblem", back_populates="test_cases")


class CandidateSubmission(Base):
    __tablename__ = "candidate_submissions"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    problem_id = Column(PortableUUID(), ForeignKey("coding_problems.id"), nullable=False, index=True)
    language = Column(String(20), nullable=False)
    code = Column(Text, nullable=False)
    judge_token = Column(String(100), nullable=True)
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.PENDING)
    execution_time_seconds = Column(Float, nullable=True)
    memory_used_mb = Column(Float, nullable=True)
    passed_test_cases = Column(Integer, default=0)
    total_test_cases = Column(Integer, default=0)
    stdout = Column(Text, nullable=True)
    stderr = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("User")
    problem = relationship("CodingProblem", back_populates="submissions")
    ai_review = relationship("AIReview", back_populates="submission", uselist=False, cascade="all, delete-orphan")


class AIReview(Base):
    __tablename__ = "ai_reviews"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    submission_id = Column(PortableUUID(), ForeignKey("candidate_submissions.id"), nullable=False, unique=True)
    time_complexity = Column(String(50), default="O(N)")
    space_complexity = Column(String(50), default="O(N)")
    code_quality_score = Column(Integer, default=85)
    correctness_feedback = Column(Text, nullable=True)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    optimization_suggestions = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("CandidateSubmission", back_populates="ai_review")


class CandidateCodingStats(Base):
    __tablename__ = "candidate_coding_stats"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id"), unique=True, nullable=False)
    total_solved = Column(Integer, default=0)
    easy_solved = Column(Integer, default=0)
    medium_solved = Column(Integer, default=0)
    hard_solved = Column(Integer, default=0)
    accuracy_percentage = Column(Float, default=0.0)
    longest_streak = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    total_score = Column(Integer, default=0)
    global_rank = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    candidate = relationship("User")


class WeeklyAssessment(Base):
    __tablename__ = "weekly_assessments"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    week_number = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    problem_ids = Column(JSON, default=list)
    duration_minutes = Column(Integer, default=60)
    score = Column(Float, default=0.0)
    accuracy = Column(Float, default=0.0)
    time_taken_seconds = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)
    ai_feedback = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    candidate = relationship("User")


class RecruiterAssessment(Base):
    __tablename__ = "recruiter_assessments"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    recruiter_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    target_role = Column(String(100), nullable=False)
    difficulty = Column(String(50), default="Medium")
    problem_ids = Column(JSON, default=list)
    time_limit_minutes = Column(Integer, default=60)
    passing_score = Column(Float, default=70.0)
    invited_candidate_ids = Column(JSON, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)
    recruiter = relationship("User")


class RecruiterAssessmentAttempt(Base):
    __tablename__ = "recruiter_assessment_attempts"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(PortableUUID(), ForeignKey("recruiter_assessments.id"), nullable=False, index=True)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="started") # started, submitted, expired
    score = Column(Float, default=0.0)
    total_points = Column(Integer, default=100)
    time_taken_seconds = Column(Integer, nullable=True)

    assessment = relationship("RecruiterAssessment")
    candidate = relationship("User")
    answers = relationship("RecruiterAssessmentAnswer", back_populates="attempt", cascade="all, delete-orphan")


class RecruiterAssessmentAnswer(Base):
    __tablename__ = "recruiter_assessment_answers"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    attempt_id = Column(PortableUUID(), ForeignKey("recruiter_assessment_attempts.id"), nullable=False, index=True)
    problem_id = Column(PortableUUID(), ForeignKey("coding_problems.id"), nullable=False, index=True)
    language = Column(String(50), nullable=False)
    source_code = Column(Text, nullable=False)
    submission_id = Column(PortableUUID(), ForeignKey("candidate_submissions.id"), nullable=True)
    points_awarded = Column(Float, default=0.0)
    status = Column(String(50), default="submitted")
    submitted_at = Column(DateTime, default=datetime.utcnow)

    attempt = relationship("RecruiterAssessmentAttempt", back_populates="answers")
    problem = relationship("CodingProblem")
    submission = relationship("CandidateSubmission")
