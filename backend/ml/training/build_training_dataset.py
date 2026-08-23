"""
Build the candidate-ranking training dataset.

Data sources (in priority order):
1. REAL LABELS   - candidate_feedback table rows written by recruiters
                   (shortlist / select / reject decisions).
2. BOOTSTRAP     - when real labels are scarce, resume x virtual-job-profile
                   pairs are scored with the current heuristic engine and weak
                   labels are derived from the composite score.

Output: data/processed/feedback_training.csv with columns:
    ats_score, skill_score, keyword_score, semantic_score,
    experience_score, education_score, project_score,
    coding_score, aptitude_score, interview_score, selected

The monthly retrain pipeline runs this before every training pass, so the
model continuously absorbs new recruiter decisions.
"""

import os
import sys
import logging
from datetime import datetime

import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal
from app.models.resume import Resume
from app.models.job import Job
from app.models.ml_models import CandidateFeedback
from app.ai.ats_scorer import ats_scorer

logger = logging.getLogger(__name__)

OUT_DIR = os.path.join("data", "processed")
OUT_FILE = os.path.join(OUT_DIR, "feedback_training.csv")

FEATURES = [
    "ats_score", "skill_score", "keyword_score", "semantic_score",
    "experience_score", "education_score", "project_score",
    "coding_score", "aptitude_score", "interview_score",
]

# Virtual role profiles used for bootstrap pairs when real feedback is scarce.
VIRTUAL_ROLES = [
    {"title": "Python Backend Developer", "skills": ["Python", "FastAPI", "SQL", "Docker", "REST API"],
     "desc": "Build scalable backend services with Python, FastAPI, PostgreSQL and Docker. REST API design, unit testing, CI/CD."},
    {"title": "Data Scientist", "skills": ["Python", "Machine Learning", "SQL", "Pandas", "Statistics"],
     "desc": "Analyze large datasets, build machine learning models with scikit-learn, pandas, numpy. Statistics and data visualization."},
    {"title": "AI/ML Engineer", "skills": ["Python", "Machine Learning", "Deep Learning", "NLP", "PyTorch"],
     "desc": "Develop deep learning and NLP models with PyTorch, transformers, LLMs. Deploy ML pipelines in production."},
    {"title": "Frontend Developer", "skills": ["JavaScript", "React", "HTML", "CSS", "Redux"],
     "desc": "Build responsive web interfaces with React, JavaScript, HTML5, CSS3. State management and component architecture."},
    {"title": "DevOps Engineer", "skills": ["Docker", "Kubernetes", "AWS", "Linux", "CI/CD"],
     "desc": "Manage cloud infrastructure on AWS, Kubernetes clusters, Docker containers, Terraform, Linux administration."},
    {"title": "Full Stack Developer", "skills": ["JavaScript", "React", "Node.js", "SQL", "Git"],
     "desc": "End-to-end web development with React, Node.js, Express, PostgreSQL. Git workflows and agile teams."},
    {"title": "Java Developer", "skills": ["Java", "Spring Boot", "SQL", "Microservices", "Hibernate"],
     "desc": "Enterprise Java development with Spring Boot, microservices architecture, Hibernate ORM, REST APIs."},
    {"title": "Data Analyst", "skills": ["SQL", "Excel", "Power BI", "Python", "Tableau"],
     "desc": "Business intelligence dashboards with Power BI, Tableau, advanced SQL queries, Excel modeling, reporting."},
]

# Composite thresholds for weak bootstrap labels
POS_THRESHOLD = 65.0
NEG_THRESHOLD = 45.0


def _resume_features(parsed: dict, job_desc: str, job_skills: list) -> dict:
    """Compute the 7 resume-derived features via the explainable ATS engine."""
    result = ats_scorer.score(parsed_resume=parsed, job_description=job_desc, job_skills=job_skills)
    b = result["score_breakdown"]
    return {
        "ats_score": float(result["ats_score"]),
        "skill_score": float(b["skill_score"]),
        "keyword_score": float(b["keyword_score"]),
        "semantic_score": float(b["semantic_score"]),
        "experience_score": float(b["experience_score"]),
        "education_score": float(b["education_score"]),
        "project_score": float(b["project_score"]),
    }


def _assessment_scores(db, user_id) -> dict:
    """Fetch coding/aptitude/interview averages for a candidate (0 if absent)."""
    out = {"coding_score": 0.0, "aptitude_score": 0.0, "interview_score": 0.0}
    try:
        from sqlalchemy import text
        row = db.execute(text(
            "SELECT AVG(score) FROM coding_submissions WHERE user_id = :u AND status = 'accepted'"
        ), {"u": str(user_id)}).scalar()
        if row:
            out["coding_score"] = round(float(row), 1)
        row = db.execute(text(
            "SELECT AVG(score) FROM aptitude_results WHERE user_id = :u"
        ), {"u": str(user_id)}).scalar()
        if row:
            out["aptitude_score"] = round(float(row), 1)
        row = db.execute(text(
            "SELECT AVG(overall_score) FROM interviews WHERE candidate_id = :u"
        ), {"u": str(user_id)}).scalar()
        if row:
            out["interview_score"] = round(float(row), 1)
    except Exception:
        pass  # tables may not exist yet - leave zeros
    return out


def build_training_dataset(min_real_samples: int = 10) -> dict:
    """Extract features + labels; returns summary stats."""
    os.makedirs(OUT_DIR, exist_ok=True)
    db = SessionLocal()
    rows = []
    label_source = "none"

    # ---- 1. Real recruiter feedback ------------------------------------
    feedback = db.query(CandidateFeedback).all()
    resume_map = {r.id: r for r in db.query(Resume).filter(Resume.is_parsed == True).all()}  # noqa: E712
    job_map = {j.id: j for j in db.query(Job).filter(Job.status == "active").all()}

    for fb in feedback:
        resume = resume_map.get(fb.resume_id)
        job = job_map.get(fb.job_id)
        if not resume or not job or fb.selected is None:
            continue
        parsed = {
            "skills": resume.parsed_skills or [],
            "experience": resume.parsed_experience or [],
            "education": resume.parsed_education or [],
            "projects": resume.parsed_projects or [],
            "certifications": resume.parsed_certifications or [],
            "summary": resume.parsed_summary or "",
        }
        feats = _resume_features(parsed, job.description or "", job.required_skills or [])
        feats.update({
            "coding_score": float(fb.coding_score or 0),
            "aptitude_score": float(fb.aptitude_score or 0),
            "interview_score": float(fb.interview_score or 0),
            "selected": int(bool(fb.selected)),
        })
        rows.append(feats)

    if len(rows) >= min_real_samples:
        label_source = f"real_recruiter_feedback ({len(rows)} samples)"
    else:
        # ---- 2. Bootstrap from virtual roles ---------------------------
        n_boot_before = len(rows)
        rng = __import__("random").Random(42)  # deterministic augmentation

        for resume in resume_map.values():
            parsed = {
                "skills": resume.parsed_skills or [],
                "experience": resume.parsed_experience or [],
                "education": resume.parsed_education or [],
                "projects": resume.parsed_projects or [],
                "certifications": resume.parsed_certifications or [],
                "summary": resume.parsed_summary or "",
            }
            if not parsed["skills"]:
                continue

            assess = _assessment_scores(db, resume.user_id)

            # Deterministic skill-subset variants simulate candidates with
            # differing coverage so the model sees a spread of match levels.
            skills = list(parsed["skills"])
            variants = [skills]
            for keep_frac in (0.7, 0.45):
                k = max(1, int(len(skills) * keep_frac))
                variant = rng.sample(skills, min(k, len(skills)))
                if sorted(variant) != sorted(skills):
                    variants.append(variant)

            for variant in variants:
                vp = {**parsed, "skills": variant}
                for role in VIRTUAL_ROLES:
                    feats = _resume_features(vp, role["desc"], role["skills"])
                    feats.update(assess)
                    composite = (
                        feats["ats_score"] * 0.40 +
                        feats["skill_score"] * 0.25 +
                        feats["semantic_score"] * 0.20 +
                        feats["experience_score"] * 0.15
                    )
                    if composite >= POS_THRESHOLD:
                        feats["selected"] = 1
                    elif composite <= NEG_THRESHOLD:
                        feats["selected"] = 0
                    else:
                        continue  # ambiguous middle band excluded
                    rows.append(feats)
        n_bootstrap = len(rows) - n_boot_before
        label_source = f"bootstrap_heuristic ({n_bootstrap} generated) + {n_boot_before} real"

    db.close()

    df = pd.DataFrame(rows)
    if not df.empty:
        df = df[FEATURES + ["selected"]].drop_duplicates()
        df.to_csv(OUT_FILE, index=False)

    summary = {
        "generated_at": datetime.now().isoformat(),
        "output_file": OUT_FILE,
        "total_samples": int(len(df)),
        "positive": int(df["selected"].sum()) if not df.empty else 0,
        "negative": int((df["selected"] == 0).sum()) if not df.empty else 0,
        "label_source": label_source,
    }
    print(f"[DATASET] {summary}")
    return summary


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    build_training_dataset()