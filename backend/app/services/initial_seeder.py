"""
Initial Database Seeder Pipeline
================================
Automatically populates initial seed data for:
- Default Admin, Recruiter, and Candidate users
- Candidate Profile & Coding Stats
- Enterprise Tech Jobs with Evaluation Weights
- Coding Assessment Problem Bank with Test Cases
- Market Intelligence & Technology Trend Benchmarks
"""

import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.user import User, UserRole, CandidateProfile, RecruiterProfile
from app.models.coding import CandidateCodingStats
from app.models.job import Job, JobStatus, JobType, ExperienceLevel
from app.models.evaluation import EvaluationWeight
from app.models.market import (
    JobMarketData, TechnologyTrend, TechnologyDailySnapshot, MarketForecast, DataSourceStatus
)
from app.utils.jwt_handler import hash_password
from app.services.dataset_importer import seed_default_problems

logger = logging.getLogger(__name__)


def seed_all_initial_data(db: Session) -> None:
    """Run all initial seeders idempotently."""
    try:
        seed_users_and_profiles(db)
        seed_coding_bank(db)
        seed_market_intelligence(db)
        logger.info("✅ All initial platform seed data verified & loaded successfully.")
    except Exception as e:
        logger.error(f"Error during initial data seeding: {e}", exc_info=True)
        db.rollback()


def seed_users_and_profiles(db: Session) -> None:
    """Seed default Admin, Recruiter, and Candidate accounts if missing."""
    default_users = [
        {
            "email": "admin@gmail.com",
            "full_name": "System Administrator",
            "role": UserRole.ADMIN,
            "password": "admin@123",
            "bio": "HireAI Platform Master Administrator.",
        },
        {
            "email": "recruiter@gmail.com",
            "full_name": "Sarah Jenkins",
            "role": UserRole.RECRUITER,
            "password": "admin@123",
            "bio": "Lead Talent Acquisition Partner at HireAI Enterprise.",
            "company": "HireAI Enterprise Systems",
        },
        {
            "email": "candidate@gmail.com",
            "full_name": "Alex Morgan",
            "role": UserRole.CANDIDATE,
            "password": "admin@123",
            "bio": "Full Stack AI & Software Engineer passionate about scalable microservices and NLP systems.",
            "phone": "+1 (555) 234-5678",
            "location": "San Francisco, CA",
        },
    ]

    for u in default_users:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            user = User(
                email=u["email"],
                full_name=u["full_name"],
                hashed_password=hash_password(u["password"]),
                role=u["role"],
                bio=u.get("bio", ""),
                phone=u.get("phone", None),
                location=u.get("location", None),
                is_active=True,
                is_verified=True,
                created_at=datetime.utcnow(),
            )
            db.add(user)
            db.flush()

            if user.role == UserRole.CANDIDATE:
                prof = CandidateProfile(
                    user_id=user.id,
                    headline="Full Stack AI & Software Engineer",
                    summary="Experienced Software Engineer with expertise in Python, FastAPI, React, and Machine Learning workflows.",
                    skills=["Python", "FastAPI", "React", "TypeScript", "Docker", "PostgreSQL", "AWS", "Machine Learning"],
                    preferred_role="Senior Software Engineer",
                    preferred_location="San Francisco, CA / Remote",
                    work_mode="Remote",
                    salary_expectation="$130,000 - $160,000",
                    education=[
                        {
                            "degree": "B.S. in Computer Science",
                            "college": "University of California, Berkeley",
                            "year": "2022",
                            "cgpa": "3.85 / 4.0",
                        }
                    ],
                    experience=[
                        {
                            "company": "TechNova Inc.",
                            "role": "Software Engineer",
                            "start_date": "2022-06",
                            "end_date": "Present",
                            "description": "Architected high-throughput REST APIs using FastAPI and deployed distributed Docker containers on AWS ECS.",
                        }
                    ],
                    projects=[
                        {
                            "name": "AI Resume & Candidate Matching Engine",
                            "description": "Engineered automated resume parsing with spaCy NLP and semantic vector similarity search.",
                            "technologies": "Python, FastAPI, SentenceTransformers, PostgreSQL",
                        }
                    ],
                    github_url="https://github.com/alexmorgan-dev",
                    linkedin_url="https://linkedin.com/in/alexmorgan-dev",
                    portfolio_url="https://alexmorgan.dev",
                    profile_completion=90,
                )
                db.add(prof)

                stats = CandidateCodingStats(
                    candidate_id=user.id,
                    total_solved=14,
                    easy_solved=8,
                    medium_solved=5,
                    hard_solved=1,
                    total_score=280,
                    accuracy_percentage=88.5,
                    longest_streak=7,
                    current_streak=4,
                )
                db.add(stats)

            elif user.role == UserRole.RECRUITER:
                rprof = RecruiterProfile(
                    user_id=user.id,
                    company_name=u.get("company", "HireAI Enterprise Systems"),
                    department="Global Engineering Recruitment",
                )
                db.add(rprof)

            db.commit()
            logger.info(f"✅ Created default user: {u['email']} ({u['role'].value})")


def seed_jobs_and_weights(db: Session) -> None:
    """Seed initial enterprise job postings with evaluation criteria weights."""
    recruiter = db.query(User).filter(User.role == UserRole.RECRUITER).first()
    recruiter_id = recruiter.id if recruiter else None

    jobs_data = [
        {
            "title": "Senior Full Stack AI Engineer",
            "company": "HireAI Enterprise Systems",
            "location": "Remote / San Francisco, CA",
            "job_type": JobType.FULL_TIME,
            "experience_level": ExperienceLevel.SENIOR,
            "salary_min": 130000,
            "salary_max": 165000,
            "description": "We are seeking a talented Senior Full Stack AI Engineer to lead development of our next-generation hiring intelligence platform. You will build resilient FastAPI microservices, design modern React frontends, and integrate NLP and transformer models for candidate ranking.",
            "required_skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "Machine Learning"],
            "preferred_skills": ["TypeScript", "AWS", "Kubernetes", "Redis", "spaCy"],
            "status": JobStatus.ACTIVE,
            "weights": {"ats_weight": 20.0, "coding_weight": 25.0, "skill_weight": 30.0, "interview_weight": 25.0},
        },
        {
            "title": "Frontend React Specialist",
            "company": "TechFlow Innovations",
            "location": "New York, NY / Hybrid",
            "job_type": JobType.FULL_TIME,
            "experience_level": ExperienceLevel.MID,
            "salary_min": 110000,
            "salary_max": 140000,
            "description": "Join TechFlow Innovations to craft delightful, high-performance web user experiences. You will design responsive component architectures, state management systems, and real-time interactive dashboards using React and Tailwind CSS.",
            "required_skills": ["React", "JavaScript", "TypeScript", "Tailwind CSS", "HTML5", "CSS3"],
            "preferred_skills": ["Next.js", "Redux", "GraphQL", "Figma", "Jest"],
            "status": JobStatus.ACTIVE,
            "weights": {"ats_weight": 25.0, "coding_weight": 30.0, "skill_weight": 25.0, "interview_weight": 20.0},
        },
        {
            "title": "Cloud DevOps & Infrastructure Engineer",
            "company": "CloudScale Systems",
            "location": "Austin, TX / Remote",
            "job_type": JobType.FULL_TIME,
            "experience_level": ExperienceLevel.SENIOR,
            "salary_min": 135000,
            "salary_max": 175000,
            "description": "Looking for an experienced Cloud & DevOps engineer to automate our cloud infrastructure, optimize CI/CD pipelines, and maintain highly available Kubernetes clusters on AWS and Google Cloud.",
            "required_skills": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Terraform"],
            "preferred_skills": ["Python", "Prometheus", "Grafana", "Ansible", "Bash"],
            "status": JobStatus.ACTIVE,
            "weights": {"ats_weight": 20.0, "coding_weight": 35.0, "skill_weight": 30.0, "interview_weight": 15.0},
        },
        {
            "title": "AI & Natural Language Processing Engineer",
            "company": "DeepVision Intelligence",
            "location": "Boston, MA / Remote",
            "job_type": JobType.FULL_TIME,
            "experience_level": ExperienceLevel.SENIOR,
            "salary_min": 145000,
            "salary_max": 185000,
            "description": "Build state-of-the-art NLP, LLM, and information extraction pipelines for real-time document analysis, semantic matching, and voice evaluation.",
            "required_skills": ["Python", "PyTorch", "NLP", "Machine Learning", "Transformers", "spaCy"],
            "preferred_skills": ["Hugging Face", "FastAPI", "Docker", "LangChain", "Vector Databases"],
            "status": JobStatus.ACTIVE,
            "weights": {"ats_weight": 20.0, "coding_weight": 30.0, "skill_weight": 30.0, "interview_weight": 20.0},
        },
    ]

    for j in jobs_data:
        existing_job = db.query(Job).filter(Job.title == j["title"]).first()
        if not existing_job:
            weights_info = j.pop("weights", None)
            job = Job(
                recruiter_id=recruiter_id,
                title=j["title"],
                company=j["company"],
                location=j["location"],
                job_type=j["job_type"],
                experience_level=j["experience_level"],
                salary_min=j["salary_min"],
                salary_max=j["salary_max"],
                description=j["description"],
                required_skills=j["required_skills"],
                preferred_skills=j["preferred_skills"],
                status=j["status"],
                created_at=datetime.utcnow(),
            )
            db.add(job)
            db.flush()

            if weights_info:
                w_row = EvaluationWeight(
                    job_id=job.id,
                    ats_weight=weights_info["ats_weight"],
                    coding_weight=weights_info["coding_weight"],
                    skill_weight=weights_info["skill_weight"],
                    interview_weight=weights_info["interview_weight"],
                )
                db.add(w_row)
            logger.info(f"✅ Seeded job: {j['title']}")

    db.commit()


def seed_coding_bank(db: Session) -> None:
    """Ensure coding problems and test cases are seeded into the database."""
    seed_default_problems(db)


def seed_market_intelligence(db: Session) -> None:
    """Seed market intelligence demand benchmarks if empty."""
    if db.query(TechnologyTrend).count() > 0:
        return

    sample_skills = [
        {"technology": "Python", "category": "Programming Language", "demand_score": 96.5, "growth_7d": 4.2, "growth_30d": 38.4, "job_count": 452, "demand_percentage": 28.5, "trend_direction": "Rapidly Growing"},
        {"technology": "React", "category": "Framework", "demand_score": 92.0, "growth_7d": 3.1, "growth_30d": 29.1, "job_count": 389, "demand_percentage": 24.2, "trend_direction": "Growing"},
        {"technology": "FastAPI", "category": "Framework", "demand_score": 88.5, "growth_7d": 6.5, "growth_30d": 45.2, "job_count": 194, "demand_percentage": 14.8, "trend_direction": "Rapidly Growing"},
        {"technology": "Docker", "category": "DevOps", "demand_score": 94.0, "growth_7d": 3.8, "growth_30d": 33.0, "job_count": 412, "demand_percentage": 26.1, "trend_direction": "Growing"},
        {"technology": "Kubernetes", "category": "DevOps", "demand_score": 91.5, "growth_7d": 4.1, "growth_30d": 36.8, "job_count": 315, "demand_percentage": 21.0, "trend_direction": "Growing"},
        {"technology": "TypeScript", "category": "Programming Language", "demand_score": 93.0, "growth_7d": 5.2, "growth_30d": 41.5, "job_count": 367, "demand_percentage": 23.4, "trend_direction": "Rapidly Growing"},
        {"technology": "PostgreSQL", "category": "Database", "demand_score": 89.0, "growth_7d": 2.4, "growth_30d": 24.3, "job_count": 283, "demand_percentage": 18.5, "trend_direction": "Stable"},
        {"technology": "PyTorch", "category": "AI/ML", "demand_score": 95.0, "growth_7d": 7.8, "growth_30d": 58.2, "job_count": 221, "demand_percentage": 16.2, "trend_direction": "Rapidly Growing"},
        {"technology": "AWS", "category": "Cloud", "demand_score": 95.5, "growth_7d": 3.0, "growth_30d": 27.9, "job_count": 486, "demand_percentage": 31.0, "trend_direction": "Growing"},
    ]

    for sk in sample_skills:
        row = TechnologyTrend(
            technology=sk["technology"],
            category=sk["category"],
            demand_score=sk["demand_score"],
            growth_7d=sk["growth_7d"],
            growth_30d=sk["growth_30d"],
            job_count=sk["job_count"],
            demand_percentage=sk["demand_percentage"],
            trend_direction=sk["trend_direction"],
            github_activity=85.0,
            search_interest=90.0,
            top_locations=[{"location": "San Francisco", "count": 140}, {"location": "Bengaluru", "count": 120}, {"location": "London", "count": 95}],
            top_roles=[{"role": "Full Stack Engineer", "count": 80}, {"role": "AI Engineer", "count": 65}],
            updated_at=datetime.utcnow(),
        )
        db.add(row)

    db.commit()
    logger.info("✅ Seeded baseline Market Intelligence technology trends.")
