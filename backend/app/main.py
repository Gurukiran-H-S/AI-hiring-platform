"""
AI Hiring Platform - FastAPI Main Application
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import logging
import time

from app.config import settings
from app.database import create_tables

# Import routers
from app.routers.auth import router as auth_router
from app.routers.resumes import router as resumes_router
from app.routers.jobs import router as jobs_router
from app.routers.admin import router as admin_router, analytics_router
from app.routers.notifications import notif_router, interview_router
from app.routers.coding import router as coding_router
from app.routers.trends import router as trends_router
from app.routers.applications import router as applications_router
from app.routers.recruiter import router as recruiter_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="""
## AI-Powered Hiring & Candidate Evaluation Platform

### Features:
- 🔐 **JWT Authentication** (Candidate / Recruiter / Admin)
- 📄 **NLP Resume Parser** (spaCy + NLTK)
- 🎯 **ATS Score Prediction** with detailed breakdown
- 🔍 **Semantic Resume-to-Job Matching** (Sentence Transformers)
- 📊 **Candidate Ranking Engine** with Explainable AI
- 🧠 **Skill Gap Analysis** + Course Recommendations
- 📅 **Interview Scheduling** with notifications
- 📈 **Analytics Dashboards**

### Built With:
FastAPI · PostgreSQL · spaCy · Sentence Transformers · SQLAlchemy
        """,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
    )

    # ─── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ─── Request Logging ───────────────────────────────────────────────────────
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration = time.time() - start
        logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration:.3f}s)")
        return response

    # ─── Startup ──────────────────────────────────────────────────────────────
    @app.on_event("startup")
    async def on_startup():
        logger.info("🚀 Starting AI Hiring Platform...")
        create_tables()
        logger.info("✅ Database tables created/verified")
        logger.info("✅ Application ready!")

    # ─── Health Check ─────────────────────────────────────────────────────────
    @app.get("/", tags=["Health"])
    async def root():
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "docs": "/api/docs",
        }

    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "ok", "timestamp": time.time()}

    # ─── Register Routers ─────────────────────────────────────────────────────
    app.include_router(auth_router)
    app.include_router(resumes_router)
    app.include_router(jobs_router)
    app.include_router(admin_router)
    app.include_router(analytics_router)
    app.include_router(notif_router)
    app.include_router(interview_router)
    app.include_router(coding_router)
    app.include_router(trends_router)
    app.include_router(applications_router)
    app.include_router(recruiter_router)

    # ─── Global Exception Handler ─────────────────────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "message": str(exc)},
        )

    return app


app = create_application()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        workers=1,
    )

#cd backend
#venv\Scripts\activate
#uvicorn app.main:app --reload

#new terminal
#cd frontend
#npm run dev
