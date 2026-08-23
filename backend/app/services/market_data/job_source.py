"""
Job Market Data Provider.
Ingests, cleans, deduplicates, and extracts skills from live job feeds and internal job postings.
"""

import httpx
import logging
from typing import Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session

from app.config import settings
from app.models.market import JobMarketData
from app.models.job import Job
from app.services.market_data.base import BaseMarketProvider
from app.services.market_data.normalizer import tech_normalizer

logger = logging.getLogger(__name__)


class JobMarketProvider(BaseMarketProvider):
    """Fetches job listings from live external feeds and internal platform jobs."""

    def get_source_id(self) -> str:
        return "job_api"

    def get_display_name(self) -> str:
        return "Global Job Market Feeds (RemoteOK & Arbeitnow)"

    def is_enabled(self) -> bool:
        return settings.MARKET_DATA_ENABLED

    def is_configured(self) -> bool:
        return True

    async def fetch(self, db: Session) -> Dict[str, Any]:
        """Fetch listings, deduplicate, extract skills, and save to JobMarketData."""
        if not self.is_enabled():
            self.update_telemetry(db, status="NOT CONFIGURED", records_collected=0, error_message="Source disabled in configuration.")
            return {"status": "DISABLED", "new_jobs": 0, "total_jobs": 0}

        total_collected = 0
        new_jobs_count = 0
        errors = []

        headers = {
            "User-Agent": "HireAI-MarketIntelligenceBot/1.0 (Enterprise Market Research; contact@hireai.com)"
        }

        # 1. Fetch from RemoteOK Public Job Feed
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.get("https://remoteok.com/api", headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    # First element is legal notice metadata, remainder are jobs
                    job_items = data[1:] if isinstance(data, list) and len(data) > 1 else []
                    for item in job_items[:80]:
                        job_id = str(item.get("id") or "")
                        if not job_id:
                            continue

                        # Deduplication check
                        exists = db.query(JobMarketData).filter(
                            JobMarketData.source == "remoteok",
                            JobMarketData.source_job_id == job_id
                        ).first()
                        if exists:
                            total_collected += 1
                            continue

                        title = item.get("position") or "Software Engineer"
                        company = item.get("company") or "Technology Company"
                        location = item.get("location") or "Remote"
                        description = item.get("description") or ""
                        raw_tags = item.get("tags") or []

                        # Extract and normalize skills
                        skills = tech_normalizer.extract_technologies(f"{title} {' '.join(raw_tags)} {description[:1000]}")

                        job_record = JobMarketData(
                            source="remoteok",
                            source_job_id=job_id,
                            source_url=item.get("url") or f"https://remoteok.com/l/{job_id}",
                            job_title=title[:250],
                            company=company[:250],
                            location=location[:250],
                            description=description[:2000],
                            employment_type="Full-time",
                            experience_level="Mid-Senior",
                            extracted_skills=skills,
                            posted_date=datetime.utcnow(),
                            collected_at=datetime.utcnow()
                        )
                        db.add(job_record)
                        new_jobs_count += 1
                        total_collected += 1

                    db.commit()
                    logger.info(f"Ingested {new_jobs_count} new jobs from RemoteOK.")
        except Exception as e:
            logger.warning(f"RemoteOK feed fetch failed: {e}")
            errors.append(f"RemoteOK: {str(e)}")

        # 2. Fetch from Arbeitnow Public Job Feed
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.get("https://www.arbeitnow.com/api/job-board-api", headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    job_items = data.get("data", [])
                    for item in job_items[:80]:
                        job_slug = str(item.get("slug") or "")
                        if not job_slug:
                            continue

                        exists = db.query(JobMarketData).filter(
                            JobMarketData.source == "arbeitnow",
                            JobMarketData.source_job_id == job_slug
                        ).first()
                        if exists:
                            total_collected += 1
                            continue

                        title = item.get("title") or "Software Engineer"
                        company = item.get("company_name") or "Tech Corp"
                        location = item.get("location") or ("Remote" if item.get("remote") else "Bengaluru / Global")
                        description = item.get("description") or ""
                        raw_tags = item.get("tags") or []

                        skills = tech_normalizer.extract_technologies(f"{title} {' '.join(raw_tags)} {description[:1000]}")

                        job_record = JobMarketData(
                            source="arbeitnow",
                            source_job_id=job_slug,
                            source_url=item.get("url"),
                            job_title=title[:250],
                            company=company[:250],
                            location=location[:250],
                            description=description[:2000],
                            employment_type="Full-time" if "full-time" in item.get("job_types", []) else "Full-time",
                            experience_level="Mid",
                            extracted_skills=skills,
                            posted_date=datetime.utcnow(),
                            collected_at=datetime.utcnow()
                        )
                        db.add(job_record)
                        new_jobs_count += 1
                        total_collected += 1

                    db.commit()
                    logger.info(f"Ingested from Arbeitnow. Total collected: {total_collected}")
        except Exception as e:
            logger.warning(f"Arbeitnow feed fetch failed: {e}")
            errors.append(f"Arbeitnow: {str(e)}")

        # 3. Synchronize Internal Database Jobs
        try:
            internal_jobs = db.query(Job).all()
            for ij in internal_jobs:
                job_id = f"int_{ij.id}"
                exists = db.query(JobMarketData).filter(
                    JobMarketData.source == "internal",
                    JobMarketData.source_job_id == job_id
                ).first()
                if not exists:
                    combined_text = f"{ij.title} {ij.description or ''} {' '.join(ij.required_skills or [])}"
                    skills = tech_normalizer.extract_technologies(combined_text)
                    job_record = JobMarketData(
                        source="internal",
                        source_job_id=job_id,
                        source_url=f"/candidate/jobs",
                        job_title=ij.title[:250],
                        company=ij.company[:250],
                        location=ij.location[:250] or "Bengaluru, Karnataka",
                        description=(ij.description or "")[:2000],
                        employment_type=ij.job_type.value if hasattr(ij.job_type, "value") else "Full-time",
                        experience_level=ij.experience_level.value if hasattr(ij.experience_level, "value") else "Mid",
                        salary_min=float(ij.min_salary) if hasattr(ij, "min_salary") and ij.min_salary else None,
                        salary_max=float(ij.max_salary) if hasattr(ij, "max_salary") and ij.max_salary else None,
                        extracted_skills=skills,
                        posted_date=ij.created_at or datetime.utcnow(),
                        collected_at=datetime.utcnow()
                    )
                    db.add(job_record)
                    new_jobs_count += 1
                total_collected += 1
            db.commit()
        except Exception as e:
            logger.warning(f"Internal job sync failed: {e}")

        # Total count in database
        total_in_db = db.query(JobMarketData).count()

        status = "CONNECTED" if total_in_db > 0 else ("ERROR" if errors else "NOT CONFIGURED")
        error_msg = "; ".join(errors) if errors else None
        self.update_telemetry(db, status=status, records_collected=total_in_db, error_message=error_msg)

        return {
            "status": status,
            "new_jobs": new_jobs_count,
            "total_jobs": total_in_db,
            "errors": errors
        }


job_market_provider = JobMarketProvider()
