"""
AI Hiring Platform - Centralized Models Hub
"""

from app.models.user import User, CandidateProfile, RecruiterProfile, UserRole, EmailVerification
from app.models.resume import Resume
from app.models.job import Job, JobStatus, JobType, ExperienceLevel
from app.models.application import Application, ApplicationStatus, SkillAssessment, CourseRecommendation, OfferLetter
from app.models.notification import Notification, NotificationType
from app.models.interview import (
    Interview, InterviewType, InterviewStatus,
    MockInterview, MockInterviewQuestion, MockInterviewResponse
)
from app.models.aptitude import AptitudeScore
from app.models.coding import CodingProblem, TestCase, CandidateSubmission, CandidateCodingStats, ProblemDifficulty
from app.models.evaluation import EvaluationWeight, CandidateScore, CandidateSkillEvaluation
from app.models.market import JobMarketData, TechnologyTrend, TechnologyDailySnapshot, MarketForecast, DataSourceStatus, MarketCollectionRun
from app.models.ml_models import (
    Skill, SkillAlias, Occupation, OccupationSkill,
    CandidateSkill, JobSkill, ResumeJobMatch, CandidateFeedback,
    ModelVersion, ForecastResult
)

__all__ = [
    "User", "CandidateProfile", "RecruiterProfile", "UserRole", "EmailVerification",
    "Resume",
    "Job", "JobStatus", "JobType", "ExperienceLevel",
    "Application", "ApplicationStatus", "SkillAssessment", "CourseRecommendation", "OfferLetter",
    "Notification", "NotificationType",
    "Interview", "InterviewType", "InterviewStatus",
    "MockInterview", "MockInterviewQuestion", "MockInterviewResponse",
    "AptitudeScore",
    "CodingProblem", "TestCase", "CandidateSubmission", "CandidateCodingStats", "ProblemDifficulty",
    "EvaluationWeight", "CandidateScore", "CandidateSkillEvaluation",
    "JobMarketData", "TechnologyTrend", "TechnologyDailySnapshot", "MarketForecast", "DataSourceStatus", "MarketCollectionRun",
    "Skill", "SkillAlias", "Occupation", "OccupationSkill",
    "CandidateSkill", "JobSkill", "ResumeJobMatch", "CandidateFeedback",
    "ModelVersion", "ForecastResult"
]
