import os
import sys
import uuid
import pandas as pd
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal
from app.models.ml_models import Skill, Occupation, OccupationSkill

ONET_DIR = os.path.join("data", "onet")

# Seeding mappings to bridge O*NET taxonomy codes
ONET_OCCUPATION_SEEDS = [
    {"name": "AI / ML Engineer", "onet_id": "15-1133.00"},
    {"name": "Software Engineer", "onet_id": "15-1132.00"},
    {"name": "Data Scientist", "onet_id": "15-1199.08"},
    {"name": "Cloud Native Architect", "onet_id": "15-1199.02"},
    {"name": "MLOps Engineer", "onet_id": "15-1199.09"}
]

ONET_SKILL_SEEDS = [
    {"canonical_name": "Python", "onet_id": "onet_sk_py"},
    {"canonical_name": "Java", "onet_id": "onet_sk_jv"},
    {"canonical_name": "SQL", "onet_id": "onet_sk_sql"},
    {"canonical_name": "Machine Learning", "onet_id": "onet_sk_ml"},
    {"canonical_name": "Docker", "onet_id": "onet_sk_dkr"},
    {"canonical_name": "AWS", "onet_id": "onet_sk_aws"},
    {"canonical_name": "Kubernetes", "onet_id": "onet_sk_k8s"}
]

def import_onet_data():
    print("==================================================")
    print("O*NET DATA INGESTION ENGINE")
    print("==================================================")
    
    os.makedirs(ONET_DIR, exist_ok=True)
    db = SessionLocal()

    print("Bridging O*NET taxonomies into unified model tables...")

    # Update Occupations with ONET IDs
    for occ in ONET_OCCUPATION_SEEDS:
        record = db.query(Occupation).filter(Occupation.name == occ["name"]).first()
        if record:
            record.onet_id = occ["onet_id"]
            db.commit()
            print(f"  [BRIDGED] Occupation '{occ['name']}' -> O*NET ID: {occ['onet_id']}")

    # Update Skills with ONET IDs
    for sk in ONET_SKILL_SEEDS:
        record = db.query(Skill).filter(Skill.canonical_name == sk["canonical_name"]).first()
        if record:
            record.onet_id = sk["onet_id"]
            db.commit()
            print(f"  [BRIDGED] Skill '{sk['canonical_name']}' -> O*NET ID: {sk['onet_id']}")

    # Check if custom downloaded O*NET CSV files exist in data/onet/
    skills_csv = os.path.join(ONET_DIR, "onet_skills.csv")
    if os.path.exists(skills_csv):
        print(f"Custom O*NET Skills CSV found: {skills_csv}. Ingesting...")
        try:
            df = pd.read_csv(skills_csv)
            for _, row in df.iterrows():
                name = str(row.get("skill_name", "")).strip()
                onet_code = str(row.get("onet_id", "")).strip()
                if name:
                    existing = db.query(Skill).filter(Skill.canonical_name == name).first()
                    if not existing:
                        sk_rec = Skill(canonical_name=name, onet_id=onet_code, source="onet")
                        db.add(sk_rec)
                    else:
                        existing.onet_id = onet_code
            db.commit()
            print("  [SUCCESS] Ingested custom O*NET skills.")
        except Exception as e:
            print(f"  [ERROR] Parsing custom O*NET CSV failed: {e}")

    db.close()
    print("O*NET Ingestion Completed successfully!")

if __name__ == "__main__":
    import_onet_data()
