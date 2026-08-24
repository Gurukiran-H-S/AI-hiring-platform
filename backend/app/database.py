import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL or ""
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

if "sqlite" in db_url or not db_url:
    engine = create_engine("sqlite:///./ai_hiring.db", connect_args={"check_same_thread": False})
else:
    try:
        engine = create_engine(
            db_url,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_pre_ping=True,
            echo=settings.DEBUG,
        )
    except Exception as e:
        logger.warning(f"Failed to initialize database with URL {db_url}: {e}. Falling back to SQLite.")
        engine = create_engine("sqlite:///./ai_hiring.db", connect_args={"check_same_thread": False})


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all database tables."""
    from app.models import user, resume, job, application, notification, interview, coding, aptitude, market  # noqa
    Base.metadata.create_all(bind=engine)
