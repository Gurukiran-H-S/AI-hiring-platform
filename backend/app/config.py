import os
from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Explicitly load .env file from backend directory and root workspace
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")


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
        """Return SMTP username supporting both SMTP_USERNAME and SMTP_USER env keys."""
        username = self.SMTP_USERNAME or self.SMTP_USER or os.getenv("SMTP_USERNAME") or os.getenv("SMTP_USER") or ""
        return username.strip()

    @property
    def effective_email_from(self) -> str:
        """Return sender email address, falling back to Gmail SMTP username."""
        username = self.effective_smtp_username
        if self.EMAIL_FROM and "noreply@aihiring" not in self.EMAIL_FROM and "@" in self.EMAIL_FROM:
            return self.EMAIL_FROM.strip()
        return username if username else "noreply@aihiring.com"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
