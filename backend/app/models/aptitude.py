import uuid
from datetime import datetime
from sqlalchemy import Column, Float, ForeignKey, Integer, DateTime, String
from app.database import Base
from app.models.types import PortableUUID

class AptitudeScore(Base):
    __tablename__ = "aptitude_scores"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(PortableUUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assessment_id = Column(String(100), nullable=False, default="TCS_NQT_SET_A")
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    percentage = Column(Float, nullable=False)
    percentile = Column(Float, nullable=True)
    taken_at = Column(DateTime, default=datetime.utcnow)
