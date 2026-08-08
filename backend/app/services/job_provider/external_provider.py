"""
Modular External Job Provider Adapter.
Integrates with legitimate external APIs when configured, falling back gracefully to DemoJobProvider.
"""

import requests
import logging
from typing import Dict, Any, Optional
from app.config import settings
from app.services.job_provider.base_provider import BaseJobProvider, NormalizedJob
from app.services.job_provider.demo_provider import DemoJobProvider

logger = logging.getLogger(__name__)


class ExternalJobProvider(BaseJobProvider):
    def __init__(self):
        self.api_key = getattr(settings, 'JOB_API_KEY', None)
        self.api_url = getattr(settings, 'JOB_API_URL', None)
        self.demo = DemoJobProvider()

    def search_jobs(
        self,
        query: Optional[str] = None,
        location: Optional[str] = None,
        job_type: Optional[str] = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        if not self.api_key or not self.api_url:
            logger.info("No external JOB_API_KEY configured. Using DemoJobProvider fallback.")
            return self.demo.search_jobs(query, location, job_type, limit)

        try:
            params = {
                "apiKey": self.api_key,
                "query": query or "Software Engineer",
                "location": location or "India",
                "limit": limit
            }
            res = requests.get(self.api_url, params=params, timeout=5)
            if res.status_code == 200:
                data = res.json()
                raw_jobs = data.get("jobs", [])
                normalized = []

                for idx, r in enumerate(raw_jobs):
                    normalized.append(NormalizedJob(
                        id=f"ext-{r.get('id', idx)}",
                        title=r.get("title", "Software Engineer"),
                        company=r.get("company", "Tech Company"),
                        location=r.get("location", "Remote / India"),
                        description=r.get("description", "Exciting software role."),
                        skills=r.get("skills", ["Python", "SQL", "Git"]),
                        salary=r.get("salary", "Competitive"),
                        employment_type=r.get("type", "Full-time"),
                        remote_type=r.get("remote", "Hybrid"),
                        posted_date=r.get("posted", "Recently"),
                        application_url=r.get("url"),
                        source="External Live API",
                        source_job_id=str(r.get("id"))
                    ))

                return {
                    "source": "External Live API",
                    "is_live": True,
                    "message": "Live current job listings retrieved from provider.",
                    "jobs": [j.dict() for j in normalized]
                }
        except Exception as e:
            logger.warning(f"External Job API call failed: {e}. Falling back to demo provider.")

        return self.demo.search_jobs(query, location, job_type, limit)
