"""
Scheduled Market Analysis Background Service.
Runs daily automated market collection cycles at configured frequency (default: 02:00 AM / 24h).
"""

import asyncio
import logging
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.config import settings
from app.services.market_data.collector import market_data_collector

logger = logging.getLogger(__name__)

_scheduler_task: asyncio.Task = None
_is_running: bool = False


async def _market_scheduler_loop():
    """Background async worker executing market intelligence ingestion on interval."""
    global _is_running
    _is_running = True
    interval_seconds = getattr(settings, "MARKET_COLLECTION_INTERVAL", 86400)
    logger.info(f"⏰ Market Intelligence background scheduler active. Interval: {interval_seconds}s ({interval_seconds / 3600:.1f} hours).")

    # Initial non-blocking check on startup: if database has 0 trend records, run initial population
    try:
        await asyncio.sleep(5)  # Wait 5 seconds after startup
        db = SessionLocal()
        try:
            from app.models.market import TechnologyTrend
            count = db.query(TechnologyTrend).count()
            if count == 0:
                logger.info("Initializing baseline market intelligence dataset on first launch...")
                await market_data_collector.run_collection_cycle(db, trigger_type="startup")
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Startup market check warning: {e}")

    while _is_running:
        try:
            # Sleep until next execution cycle
            await asyncio.sleep(interval_seconds)
            logger.info("⏰ Executing scheduled daily market intelligence collection cycle...")
            db = SessionLocal()
            try:
                await market_data_collector.run_collection_cycle(db, trigger_type="scheduled")
            finally:
                db.close()
        except asyncio.CancelledError:
            logger.info("Market scheduler task cancelled.")
            break
        except Exception as e:
            logger.error(f"Market scheduler execution error: {e}")
            await asyncio.sleep(60)  # Wait a minute before retry if unexpected error


def start_market_scheduler():
    """Initialize background scheduler task on FastAPI startup."""
    global _scheduler_task
    if _scheduler_task is None or _scheduler_task.done():
        try:
            loop = asyncio.get_event_loop()
            _scheduler_task = loop.create_task(_market_scheduler_loop())
            logger.info("✅ AI Job Market Intelligence Scheduler initialized.")
        except Exception as e:
            logger.warning(f"Could not create market scheduler background task: {e}")


def stop_market_scheduler():
    """Gracefully cancel scheduler task on server shutdown."""
    global _scheduler_task, _is_running
    _is_running = False
    if _scheduler_task and not _scheduler_task.done():
        _scheduler_task.cancel()
        logger.info("Market scheduler stopped.")
