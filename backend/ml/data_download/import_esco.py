import os
import sys
import uuid
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal, engine
from app.models.ml_models import Skill, SkillAlias, Occupation, OccupationSkill

ESCO_DIR = os.path.join("data", "esco")

# Predefined developer occupations & skills for seeding fallback/standard layers
FALLBACK_OCCUPATIONS = [
    {"name": "AI / ML Engineer", "esco_id": "esco_occ_001", "description": "Responsible for building, training, and deploying Machine Learning and AI models."},
    {"name": "Software Engineer", "esco_id": "esco_occ_002", "description": "Builds high-performance backend, frontend, and database architectures."},
    {"name": "Data Scientist", "esco_id": "esco_occ_003", "description": "Extracts insights from structured/unstructured datasets using statistics and algorithms."},
    {"name": "Cloud Native Architect", "esco_id": "esco_occ_004", "description": "Designs scalable distributed systems using Kubernetes and cloud providers."},
    {"name": "MLOps Engineer", "esco_id": "esco_occ_005", "description": "Specializes in automated model packaging, versioning, deployment, and monitoring."}
]

FALLBACK_SKILLS = [
    # AI/ML & NLP (Step 45 list)
    {"canonical_name": "Python", "category": "AI/ML", "esco_id": "esco_sk_001"},
    {"canonical_name": "Java", "category": "Backend", "esco_id": "esco_sk_002"},
    {"canonical_name": "SQL", "category": "Database", "esco_id": "esco_sk_003"},
    {"canonical_name": "Machine Learning", "category": "AI/ML", "esco_id": "esco_sk_004"},
    {"canonical_name": "Deep Learning", "category": "AI/ML", "esco_id": "esco_sk_005"},
    {"canonical_name": "Natural Language Processing", "category": "AI/ML", "esco_id": "esco_sk_006"},
    {"canonical_name": "Computer Vision", "category": "AI/ML", "esco_id": "esco_sk_007"},
    {"canonical_name": "PyTorch", "category": "AI/ML", "esco_id": "esco_sk_008"},
    {"canonical_name": "TensorFlow", "category": "AI/ML", "esco_id": "esco_sk_009"},
    {"canonical_name": "scikit-learn", "category": "AI/ML", "esco_id": "esco_sk_010"},
    {"canonical_name": "spaCy", "category": "AI/ML", "esco_id": "esco_sk_011"},
    {"canonical_name": "Sentence Transformers", "category": "AI/ML", "esco_id": "esco_sk_012"},
    {"canonical_name": "YOLO", "category": "AI/ML", "esco_id": "esco_sk_013"},
    {"canonical_name": "OpenCV", "category": "AI/ML", "esco_id": "esco_sk_014"},
    {"canonical_name": "FastAPI", "category": "Backend", "esco_id": "esco_sk_015"},
    {"canonical_name": "Flask", "category": "Backend", "esco_id": "esco_sk_016"},
    {"canonical_name": "REST API", "category": "Web Services", "esco_id": "esco_sk_017"},
    {"canonical_name": "PostgreSQL", "category": "Database", "esco_id": "esco_sk_018"},
    {"canonical_name": "Docker", "category": "DevOps", "esco_id": "esco_sk_019"},
    {"canonical_name": "AWS", "category": "Cloud", "esco_id": "esco_sk_020"},
    {"canonical_name": "Git", "category": "Tools", "esco_id": "esco_sk_021"},
    {"canonical_name": "GitHub", "category": "Tools", "esco_id": "esco_sk_022"},
    {"canonical_name": "Jenkins", "category": "DevOps", "esco_id": "esco_sk_023"},
    {"canonical_name": "Data Structures and Algorithms", "category": "Computer Science", "esco_id": "esco_sk_024"},
    {"canonical_name": "OOP", "category": "Programming Concepts", "esco_id": "esco_sk_025"},
    {"canonical_name": "DBMS", "category": "Database", "esco_id": "esco_sk_026"},
    {"canonical_name": "Semantic Matching", "category": "AI/ML", "esco_id": "esco_sk_027"},
    {"canonical_name": "Recommendation Systems", "category": "AI/ML", "esco_id": "esco_sk_028"},
    {"canonical_name": "Explainable AI", "category": "AI/ML", "esco_id": "esco_sk_029"},
    {"canonical_name": "Kubernetes", "category": "DevOps", "esco_id": "esco_sk_030"},
    {"canonical_name": "React", "category": "Frontend", "esco_id": "esco_sk_031"},
    {"canonical_name": "JavaScript", "category": "Frontend", "esco_id": "esco_sk_032"}
]

FALLBACK_ALIASES = [
    {"alias": "RESTful APIs", "canonical": "REST API"},
    {"alias": "RESTful API", "canonical": "REST API"},
    {"alias": "RESTful services", "canonical": "REST API"},
    {"alias": "sklearn", "canonical": "scikit-learn"},
    {"alias": "Postgres", "canonical": "PostgreSQL"},
    {"alias": "ReactJS", "canonical": "React"},
    {"alias": "NLP", "canonical": "Natural Language Processing"},
    {"alias": "ML", "canonical": "Machine Learning"},
    {"alias": "DL", "canonical": "Deep Learning"}
]

def import_esco_data():
    print("==================================================")
    print("ESCO DATA INGESTION ENGINE")
    print("==================================================")
    
    os.makedirs(ESCO_DIR, exist_ok=True)
    db = SessionLocal()

    # Ingest fallback standard seeds first to guarantee existence
    print("Seeding standard ESCO reference data...")
    
    # 1. Seed Occupations
    occ_map = {}
    for occ in FALLBACK_OCCUPATIONS:
        record = db.query(Occupation).filter(Occupation.esco_id == occ["esco_id"]).first()
        if not record:
            record = db.query(Occupation).filter(Occupation.name == occ["name"]).first()
        if not record:
            record = Occupation(name=occ["name"], esco_id=occ["esco_id"], description=occ["description"])
            db.add(record)
            db.commit()
            db.refresh(record)
        occ_map[occ["name"]] = record
    
    # 2. Seed Skills
    skill_map = {}
    for sk in FALLBACK_SKILLS:
        record = db.query(Skill).filter(Skill.esco_id == sk["esco_id"]).first()
        if not record:
            record = db.query(Skill).filter(Skill.canonical_name == sk["canonical_name"]).first()
        if not record:
            record = Skill(canonical_name=sk["canonical_name"], category=sk["category"], esco_id=sk["esco_id"], source="esco")
            db.add(record)
            db.commit()
            db.refresh(record)
        skill_map[sk["canonical_name"]] = record

    # 3. Seed Skill Aliases
    for al in FALLBACK_ALIASES:
        skill_rec = skill_map.get(al["canonical"])
        if not skill_rec:
            skill_rec = db.query(Skill).filter(Skill.canonical_name == al["canonical"]).first()
        if skill_rec:
            record = db.query(SkillAlias).filter(SkillAlias.alias == al["alias"]).first()
            if not record:
                record = SkillAlias(skill_id=skill_rec.id, alias=al["alias"])
                db.add(record)
    db.commit()

    # 4. Link Occupations to Skills (Essential relationships)
    for occ_name, occ_rec in occ_map.items():
        for skill_name, skill_rec in skill_map.items():
            # Soft-link everything as essential/optional for demo/baseline matching
            existing = db.query(OccupationSkill).filter(
                OccupationSkill.occupation_id == occ_rec.id,
                OccupationSkill.skill_id == skill_rec.id
            ).first()
            if not existing:
                rel = OccupationSkill(
                    occupation_id=occ_rec.id,
                    skill_id=skill_rec.id,
                    relation_type="essential" if skill_name in ["Python", "SQL", "Git"] else "optional"
                )
                db.add(rel)
    db.commit()

    # Check if custom downloaded ESCO CSVs exist in data/esco/
    skills_csv = os.path.join(ESCO_DIR, "skills_en.csv")
    occupations_csv = os.path.join(ESCO_DIR, "occupations_en.csv")

    if os.path.exists(skills_csv):
        print(f"Custom ESCO Skills CSV found: {skills_csv}. Parsing and loading...")
        try:
            df = pd.read_csv(skills_csv)
            # Standard ESCO columns: conceptUri, preferredLabel, description
            for _, row in df.iterrows():
                label = str(row.get("preferredLabel", "")).strip()
                uri = str(row.get("conceptUri", "")).strip()
                desc = str(row.get("description", "")).strip()
                if label and not db.query(Skill).filter(Skill.canonical_name == label).first():
                    sk_rec = Skill(canonical_name=label, esco_id=uri, description=desc, source="esco")
                    db.add(sk_rec)
            db.commit()
            print("  [SUCCESS] Ingested custom ESCO skills.")
        except Exception as e:
            print(f"  [ERROR] Parsing custom ESCO skills failed: {e}")

    db.close()
    print("ESCO Ingestion Completed successfully!")

if __name__ == "__main__":
    import_esco_data()
