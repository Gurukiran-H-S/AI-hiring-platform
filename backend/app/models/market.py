import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, JSON, UniqueConstraint, Index
from app.database import Base
from app.models.types import PortableUUID


class JobMarketData(Base):
    """Raw and processed job posting records for market demand tracking."""
    __tablename__ = "job_market_data"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    source = Column(String(100), nullable=False, index=True)  # 'remoteok', 'arbeitnow', 'adzuna', 'internal'
    source_job_id = Column(String(255), nullable=True, index=True)
    source_url = Column(Text, nullable=True)

    job_title = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True, index=True)
    description = Column(Text, nullable=True)
    employment_type = Column(String(100), default="Full-time")
    experience_level = Column(String(100), default="Mid")
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    currency = Column(String(20), default="INR")

    extracted_skills = Column(JSON, default=list)  # ["Python", "Docker", "AWS"]
    posted_date = Column(DateTime, nullable=True)
    collected_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("source", "source_job_id", name="uq_source_job_id"),
    )


class TechnologyTrend(Base):
    """Aggregated current market trend statistics per technology."""
    __tablename__ = "technology_trends"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    technology = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)  # 'Programming Language', 'Framework', 'Cloud', etc.

    job_count = Column(Integer, default=0)
    demand_percentage = Column(Float, default=0.0)  # % of analyzed jobs mentioning this tech
    growth_7d = Column(Float, default=0.0)          # 7-day growth %
    growth_30d = Column(Float, default=0.0)         # 30-day growth %
    demand_score = Column(Float, default=0.0)       # HireAI Demand Score (0-100)
    github_activity = Column(Float, default=0.0)    # GitHub developer index (0-100)
    search_interest = Column(Float, default=0.0)    # Search trend index (0-100)
    trend_direction = Column(String(50), default="Stable")  # 'Rapidly Growing', 'Growing', 'Stable', 'Declining'

    top_locations = Column(JSON, default=list)      # [{"location": "Bengaluru", "count": 120}, ...]
    top_roles = Column(JSON, default=list)          # [{"role": "AI Engineer", "count": 90}, ...]
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TechnologyDailySnapshot(Base):
    """Immutable daily historical snapshot for trend analysis and time-series forecasting."""
    __tablename__ = "technology_daily_snapshots"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    snapshot_date = Column(String(20), nullable=False, index=True)  # 'YYYY-MM-DD'
    technology = Column(String(100), nullable=False, index=True)
    category = Column(String(100), nullable=False)

    job_count = Column(Integer, default=0)
    demand_percentage = Column(Float, default=0.0)
    growth_percentage = Column(Float, default=0.0)  # Day-over-day growth %
    demand_score = Column(Float, default=0.0)
    github_activity = Column(Float, default=0.0)
    search_interest = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("snapshot_date", "technology", name="uq_snapshot_date_tech"),
        Index("idx_snapshot_date_tech", "snapshot_date", "technology"),
    )


class MarketForecast(Base):
    """Time-series predicted future demand for technologies."""
    __tablename__ = "market_forecasts"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    technology = Column(String(100), nullable=False, index=True)
    forecast_horizon = Column(String(20), nullable=False)  # '7d', '30d', '90d'
    forecast_date = Column(String(20), nullable=False)     # Target projection date 'YYYY-MM-DD'
    predicted_demand = Column(Float, default=0.0)          # Predicted demand score / %
    lower_bound = Column(Float, nullable=True)
    upper_bound = Column(Float, nullable=True)
    confidence_level = Column(String(20), default="High")
    model_name = Column(String(100), default="LinearTrendRegressor")
    generated_at = Column(DateTime, default=datetime.utcnow)


class DataSourceStatus(Base):
    """Operational telemetry tracking health, status, and freshness of external data sources."""
    __tablename__ = "data_source_status"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    source = Column(String(100), unique=True, nullable=False, index=True)  # 'job_api', 'github', 'google_trends'
    name = Column(String(150), nullable=False)
    status = Column(String(50), default="NOT CONFIGURED")  # 'CONNECTED', 'DEGRADED', 'ERROR', 'NOT CONFIGURED'
    records_collected = Column(Integer, default=0)
    last_success = Column(DateTime, nullable=True)
    last_failure = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MarketCollectionRun(Base):
    """Execution history of scheduled and manual data collection cycles."""
    __tablename__ = "market_collection_runs"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    trigger_type = Column(String(50), default="scheduled")  # 'scheduled', 'manual', 'startup'
    jobs_analyzed = Column(Integer, default=0)
    technologies_tracked = Column(Integer, default=0)
    status = Column(String(50), default="completed")  # 'running', 'completed', 'failed'
    duration_seconds = Column(Float, default=0.0)
    error_log = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
