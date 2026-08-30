"""
Resume Parser and ATS Scoring Pipeline Tests.
"""

import os
import sys
import pytest

backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.ai.resume_parser import resume_parser
from app.ai.ats_scorer import ats_scorer
from app.ai.skill_normalizer import skill_normalizer


SAMPLE_RESUME_TEXT = """
Jane Doe
Email: jane.doe@example.com | Phone: +1 555-0199 | Location: San Francisco, CA
LinkedIn: linkedin.com/in/janedoe | GitHub: github.com/janedoe

PROFESSIONAL SUMMARY
Experienced Senior Software Engineer with 6+ years of expertise in Python, FastAPI, PostgreSQL, Docker, and AWS. Proven track record of designing high-throughput distributed microservices.

TECHNICAL SKILLS
Languages: Python, TypeScript, SQL, JavaScript, C++
Frameworks: FastAPI, Django, React, Node.js
Cloud & DevOps: Docker, Kubernetes, AWS (S3, EC2, Lambda), CI/CD
Databases: PostgreSQL, Redis, MongoDB

WORK EXPERIENCE
Senior Backend Engineer | TechCorp Inc. | 2021 - Present
- Architected REST APIs and microservices handling 50k requests per minute using Python and FastAPI.
- Reduced database query latency by 45% through PostgreSQL indexing and Redis caching.
- Led Docker containerization and Kubernetes deployments on AWS.

Software Developer | DataSystems LLC | 2018 - 2021
- Developed full-stack web applications using React and Django.
- Implemented automated CI/CD pipelines with GitHub Actions.

EDUCATION
Bachelor of Science in Computer Science | Stanford University | 2014 - 2018 | GPA: 3.8/4.0

PROJECTS
- AI Hiring Platform: Built end-to-end recruitment platform with spaCy NLP parsing and automated code sandboxing.
"""


def test_resume_parser_extraction():
    parsed = resume_parser.parse(SAMPLE_RESUME_TEXT)
    assert parsed is not None
    assert parsed.get("name") == "Jane Doe"
    assert "jane.doe@example.com" in (parsed.get("email") or "")
    assert len(parsed.get("skills", [])) > 0
    assert any("python" in s.lower() for s in parsed.get("skills", []))
    assert parsed.get("experience") is not None
    assert parsed.get("education") is not None


def test_candidate_name_robustness():
    # 1. Delimited header line
    res1 = resume_parser.parse("Rohit Sharma | ro45che@gmail.com | +91-9353064227\nBengaluru, Karnataka\nSkills: Python")
    assert res1.get("name") == "Rohit Sharma"
    assert res1.get("email") == "ro45che@gmail.com"
    assert res1.get("location") == "Bengaluru, Karnataka"

    # 2. Labeled format
    res2 = resume_parser.parse("Full Name: Alice Wonderland\nEmail: alice@test.com\nPhone: +91-9876543210")
    assert res2.get("name") == "Alice Wonderland"

    # 3. Email only on line 1 - Ensure raw email is NEVER classified as candidate name
    res3 = resume_parser.parse("ro45che@gmail.com\n+91-9353064227\nBengaluru, Karnataka\nSkills: React, FastAPI")
    assert res3.get("name") is None  # Must NOT be 'ro45che@gmail.com'
    assert res3.get("email") == "ro45che@gmail.com"
    assert "9353064227" in (res3.get("phone") or "")

    # 4. Clean structured email fallback
    res4 = resume_parser.parse("john.doe@gmail.com\n+1 555-123-4567\nSeattle, WA")
    assert res4.get("name") == "John Doe"


def test_skill_normalizer():
    res_py = skill_normalizer.normalize("py")
    assert res_py["normalized_skill"] == "Python"
    assert res_py["category"] == "Programming Language"
    assert res_py["confidence_score"] >= 0.95

    res_k8s = skill_normalizer.normalize("k8s")
    assert res_k8s["normalized_skill"] == "Kubernetes"

    res_postgres = skill_normalizer.normalize("postgres")
    assert res_postgres["normalized_skill"] == "PostgreSQL"


def test_ats_scorer_pipeline():
    parsed = resume_parser.parse(SAMPLE_RESUME_TEXT)
    scored = ats_scorer.score(parsed)
    assert scored is not None
    assert "ats_score" in scored
    assert 0 <= scored["ats_score"] <= 100
    assert "score_breakdown" in scored
    assert "explanation" in scored


if __name__ == "__main__":
    pytest.main([__file__])

