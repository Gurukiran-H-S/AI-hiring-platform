"""
Abstract Base Class for Job Providers.
Normalizes all external and internal job data into one standard model.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class NormalizedJob(BaseModel):
    id: str
    title: str
    company: str
    location: str
    description: str
    skills: List[str]
    salary: Optional[str] = "Competitive"
    employment_type: str = "Full-time"  # Full-time, Part-time, Contract, Internship
    remote_type: str = "Hybrid"        # Remote, On-site, Hybrid
    posted_date: str = "Recently"
    application_url: Optional[str] = None
    source: str = "Platform"
    source_job_id: Optional[str] = None


class BaseJobProvider(ABC):
    @abstractmethod
    def search_jobs(
        self,
        query: Optional[str] = None,
        location: Optional[str] = None,
        job_type: Optional[str] = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Search jobs from the provider and return normalized results."""
        pass
