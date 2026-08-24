import os
from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Unified Recruitment Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/ai_hiring_db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # JWT
    SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Email (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    SMTP_FALLBACK_ON_FAILURE: bool = False

    # External Job Provider API
    JOB_PROVIDER: str = "demo"
    JOB_API_KEY: str = ""
    JOB_API_URL: str = ""

    # AI Job Market Intelligence & Technology Trend Analyzer
    MARKET_API_KEY: str = ""
    GITHUB_TOKEN: str = ""
    GOOGLE_TRENDS_API_KEY: str = ""
    MARKET_DATA_ENABLED: bool = True
    GITHUB_ENABLED: bool = True
    GOOGLE_TRENDS_ENABLED: bool = False
    MARKET_COLLECTION_INTERVAL: int = 86400  # Default: 24 hours (86,400 seconds)
    MARKET_DATA_PROVIDER: str = "remoteok,arbeitnow,adzuna,internal"

    # AI Models
    SENTENCE_TRANSFORMER_MODEL: str = "all-MiniLM-L6-v2"
    SPACY_MODEL: str = "en_core_web_sm"

    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://aihiring.vercel.app",
    ]
    FRONTEND_URL: str = "http://localhost:5173"

    # File Upload
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_FILE_TYPES: list = ["application/pdf", "application/msword",
                                 "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]

    @property
    def effective_smtp_username(self) -> str:
        """Return SMTP username supporting SMTP_USERNAME, SMTP_USER, GMAIL_USER env keys."""
        username = (
            os.getenv("SMTP_USERNAME")
            or os.getenv("SMTP_USER")
            or os.getenv("GMAIL_USER")
            or self.SMTP_USERNAME
            or self.SMTP_USER
            or ""
        )
        if username in ["your_email@gmail.com", "yourname@gmail.com"]:
            return ""
        return username.strip()

    @property
    def effective_smtp_password(self) -> str:
        """Return SMTP password supporting SMTP_PASSWORD, SMTP_PASS, GMAIL_APP_PASSWORD."""
        password = (
            os.getenv("SMTP_PASSWORD")
            or os.getenv("SMTP_PASS")
            or os.getenv("GMAIL_APP_PASSWORD")
            or os.getenv("GMAIL_PASSWORD")
            or self.SMTP_PASSWORD
            or ""
        )
        return password.strip().replace(" ", "")

    @property
    def effective_email_from(self) -> str:
        """Return sender email address, falling back to Gmail SMTP username."""
        from_email = (
            os.getenv("EMAIL_FROM")
            or self.EMAIL_FROM
            or self.effective_smtp_username
            or ""
        )
        if from_email and "noreply@aihiring" not in from_email and "@" in from_email:
            return from_email.strip()
        return self.effective_smtp_username if self.effective_smtp_username else "noreply@aihiring.com"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
