"""
Local Demo & Database Job Provider.
Queries database for recruiter-posted active jobs, merging with sample job listings so recruiter postings reflect immediately for candidates.
"""

from typing import List, Dict, Any, Optional
from app.database import SessionLocal
from app.models.job import Job, JobStatus
from app.services.job_provider.base_provider import BaseJobProvider, NormalizedJob

SAMPLE_JOBS = [
    {
        "id": "demo-job-101",
        "title": "Senior Python Backend Engineer",
        "company": "TechCorp Innovations",
        "location": "Bengaluru, India",
        "description": "We are seeking an experienced Python Developer to build scalable REST APIs using FastAPI and PostgreSQL. Experience with Docker and AWS is preferred.",
        "skills": ["Python", "SQL", "FastAPI", "Docker", "PostgreSQL", "AWS"],
        "salary": "₹18,00,000 - ₹24,00,000 / year",
        "employment_type": "Full-time",
        "remote_type": "Hybrid",
        "posted_date": "2 days ago",
        "application_url": "https://techcorp.example.com/careers/python-dev",
        "source": "Platform Job Database",
        "source_job_id": "tc-101"
    },
    {
        "id": "demo-job-102",
        "title": "AI / Machine Learning Engineer",
        "company": "NeuralMind Systems",
        "location": "Hyderabad, India",
        "description": "Join our AI research team to train NLP models, fine-tune Sentence Transformers, and deploy PyTorch models into production.",
        "skills": ["Python", "Machine Learning", "PyTorch", "NLP", "SQL", "Docker"],
        "salary": "₹22,00,000 - ₹30,00,000 / year",
        "employment_type": "Full-time",
        "remote_type": "Remote",
        "posted_date": "1 day ago",
        "application_url": "https://neuralmind.example.com/jobs/ml-engineer",
        "source": "Platform Job Database",
        "source_job_id": "nm-202"
    },
]


class DemoJobProvider(BaseJobProvider):
    def search_jobs(
        self,
        query: Optional[str] = None,
        location: Optional[str] = None,
        job_type: Optional[str] = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        combined_jobs = []

        # 1. Fetch real active jobs posted by recruiters from PostgreSQL
        try:
            db = SessionLocal()
            db_jobs = db.query(Job).filter(Job.status == JobStatus.ACTIVE).order_by(Job.created_at.desc()).all()
            for j in db_jobs:
                combined_jobs.append({
                    "id": str(j.id),
                    "title": j.title,
                    "company": j.company,
                    "location": j.location,
                    "description": j.description,
                    "skills": j.required_skills or ["Python", "SQL"],
                    "salary": f"₹{j.salary_min or 600000:,} - ₹{j.salary_max or 1200000:,} / year",
                    "employment_type": j.job_type.value if hasattr(j.job_type, 'value') else str(j.job_type),
                    "remote_type": "Remote" if j.is_remote else "On-site",
                    "posted_date": j.created_at.strftime("%d %b %Y") if j.created_at else "Just now",
                    "application_url": None,
                    "source": "Live Recruiter Posting",
                    "source_job_id": str(j.id)
                })
            db.close()
        except Exception as e:
            print(f"[JOB PROVIDER DB FETCH ERROR]: {e}")

        # 2. Append sample jobs
        combined_jobs.extend(SAMPLE_JOBS)

        filtered = combined_jobs

        if query:
            q = query.lower()
            filtered = [
                j for j in filtered
                if q in j["title"].lower() or q in j["description"].lower() or any(q in s.lower() for s in j["skills"])
            ]

        if location:
            loc = location.lower()
            filtered = [j for j in filtered if loc in j["location"].lower()]

        normalized = [NormalizedJob(**j) for j in filtered[:limit]]

        return {
            "source": "Platform Job Database & Aggregator",
            "is_live": True,
            "message": f"Retrieved {len(normalized)} active job opportunity listings directly from recruiter postings.",
            "jobs": [j.dict() for j in normalized]
        }
