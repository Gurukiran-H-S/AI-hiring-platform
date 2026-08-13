from app.models.user import User, CandidateProfile, RecruiterProfile, UserRole
from app.models.resume import Resume
from app.models.job import Job, JobStatus, JobType, ExperienceLevel
from app.models.application import Application, ApplicationStatus, SkillAssessment, CourseRecommendation
from app.models.notification import Notification, NotificationType
from app.models.interview import Interview, InterviewType, InterviewStatus
from app.models.aptitude import AptitudeScore

__all__ = [
    "User", "CandidateProfile", "RecruiterProfile", "UserRole",
    "Resume",
    "Job", "JobStatus", "JobType", "ExperienceLevel",
    "Application", "ApplicationStatus", "SkillAssessment", "CourseRecommendation",
    "Notification", "NotificationType",
    "Interview", "InterviewType", "InterviewStatus",
    "AptitudeScore"
]

