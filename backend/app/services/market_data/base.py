"""
Base Market Data Provider Interface and Status Management.
Provides abstract contract, fault isolation, timeout limits, and telemetry tracking.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging
from sqlalchemy.orm import Session
from app.models.market import DataSourceStatus

logger = logging.getLogger(__name__)


class BaseMarketProvider(ABC):
    """Abstract interface for independent external market data sources."""

    @abstractmethod
    def get_source_id(self) -> str:
        """Unique identifier key (e.g. 'job_api', 'github', 'google_trends')."""
        pass

    @abstractmethod
    def get_display_name(self) -> str:
        """Human-readable provider name."""
        pass

    @abstractmethod
    def is_enabled(self) -> bool:
        """Check if source is enabled via configuration."""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Check if credentials / configuration prerequisites are met."""
        pass

    @abstractmethod
    async def fetch(self, db: Session) -> Dict[str, Any]:
        """Execute data retrieval and return standardized payload."""
        pass

    def update_telemetry(
        self,
        db: Session,
        status: str,
        records_collected: int = 0,
        error_message: Optional[str] = None
    ) -> None:
        """Update or create DataSourceStatus tracking record in database."""
        try:
            source_id = self.get_source_id()
            status_record = db.query(DataSourceStatus).filter(DataSourceStatus.source == source_id).first()
            if not status_record:
                status_record = DataSourceStatus(
                    source=source_id,
                    name=self.get_display_name(),
                    status=status,
                    records_collected=records_collected,
                    updated_at=datetime.utcnow()
                )
                db.add(status_record)
            else:
                status_record.name = self.get_display_name()
                status_record.status = status
                if records_collected > 0:
                    status_record.records_collected = records_collected
                status_record.updated_at = datetime.utcnow()

            if status == "CONNECTED":
                status_record.last_success = datetime.utcnow()
                status_record.error_message = None
            elif status in ("ERROR", "DEGRADED"):
                status_record.last_failure = datetime.utcnow()
                status_record.error_message = error_message

            db.commit()
        except Exception as e:
            logger.error(f"Failed to update telemetry for {self.get_source_id()}: {e}")
            db.rollback()
