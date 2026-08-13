import os
import sys
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal
from app.models.ml_models import Skill, SkillAlias

PROCESSED_DATA_DIR = os.path.join("data", "processed")
MASTER_DICT_FILE = os.path.join(PROCESSED_DATA_DIR, "master_skill_dictionary.csv")

def prepare_master_dictionary():
    print("==================================================")
    print("PREPARE MASTER SKILL DICTIONARY")
    print("==================================================")
    
    os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)
    db = SessionLocal()

    records = []

    # 1. Fetch skills from SQL Database
    skills = db.query(Skill).all()
    print(f"Reading {len(skills)} canonical skills from database...")
    for sk in skills:
        records.append({
            "skill_id": str(sk.id),
            "canonical_name": sk.canonical_name,
            "alias": sk.canonical_name,
            "category": sk.category or "General",
            "esco_id": sk.esco_id or "",
            "onet_id": sk.onet_id or "",
            "source": sk.source or "db"
        })

        # 2. Add aliases
        for al in sk.aliases:
            records.append({
                "skill_id": str(sk.id),
                "canonical_name": sk.canonical_name,
                "alias": al.alias,
                "category": sk.category or "General",
                "esco_id": sk.esco_id or "",
                "onet_id": sk.onet_id or "",
                "source": "alias"
            })

    db.close()

    if not records:
        print("No skill records found in database. Preparing basic fallback row.")
        records.append({
            "skill_id": "fallback_id",
            "canonical_name": "Python",
            "alias": "Python",
            "category": "Programming",
            "esco_id": "",
            "onet_id": "",
            "source": "fallback"
        })

    df = pd.DataFrame(records)
    # Deduplicate by canonical_name and alias combination
    df.drop_duplicates(subset=["canonical_name", "alias"], keep="first", inplace=True)
    
    df.to_csv(MASTER_DICT_FILE, index=False)
    print(f"[SUCCESS] Exported Master Skill Dictionary to: {MASTER_DICT_FILE}")
    print(f"          Total mappings: {len(df)}")
    
    return MASTER_DICT_FILE

if __name__ == "__main__":
    prepare_master_dictionary()
