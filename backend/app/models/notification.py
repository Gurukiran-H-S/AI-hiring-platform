import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.types import PortableUUID
import enum


class NotificationType(str, enum.Enum):
    APPLICATION_RECEIVED = "application_received"
    APPLICATION_STATUS = "application_status"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_REMINDER = "interview_reminder"
    JOB_MATCH = "job_match"
    SHORTLISTED = "shortlisted"
    OFFER_RECEIVED = "offer_received"
    REJECTED = "rejected"
    SYSTEM = "system"
    COURSE_RECOMMENDATION = "course_recommendation"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(PortableUUID(), ForeignKey("users.id"), nullable=False, index=True)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(500), nullable=True)  # Navigation link
    is_read = Column(Boolean, default=False)
    metadata_ = Column("metadata", String(1000), nullable=True)  # Extra JSON as string

    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="notifications")

    def __repr__(self):
        return f"<Notification {self.type} -> {self.user_id}>"
