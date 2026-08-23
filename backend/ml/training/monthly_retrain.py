"""
HireAI Monthly Model Retraining Pipeline
=========================================
Run monthly (Windows Task Scheduler -> scripts/monthly_retrain.bat).

Flow:
 1. Rebuild the training dataset from current DB state
    (real recruiter feedback first; bootstrap weak labels to top up).
 2. Retrain ALL models: ranking, matching, skill extractor, forecasting.
 3. Record honest metrics under ml/models/<name>/metrics.json and ml/logs/.
 4. Register the new ranking-model version in the model_versions table.

The model improves automatically over time because every recruiter
shortlist/reject decision adds a real training label.
"""

import os
import sys
import json
import logging
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

LOG_DIR = os.path.join("ml", "logs")
os.makedirs(LOG_DIR, exist_ok=True)
log_file = os.path.join(LOG_DIR, f"retrain_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
logging.basicConfig(
    filename=log_file, level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


def register_model_version(db, name: str, version: str, metrics: dict):
    """Best-effort registration into the model_versions table."""
    try:
        from app.models.ml_models import ModelVersion
        mv = ModelVersion(
            name=name,
            version=version,
            dataset="data/processed/feedback_training.csv",
            training_date=datetime.now(),
            metrics={k: v for k, v in metrics.items()
                     if isinstance(v, (int, float, str, bool))},
            model_path=os.path.join("ml", "models", "ranking", "candidate_ranker.joblib"),
            is_active=True,
        )
        db.add(mv)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logging.warning(f"Could not register model version for {name}: {e}")
        return False


def main():
    started = datetime.now()
    print("=" * 56)
    print(f"HIREAI MONTHLY RETRAIN - {started.isoformat()}")
    print("=" * 56)

    # ---- Step 1: rebuild training data ---------------------------------
    print("\n[1/4] Building training dataset from database...")
    try:
        from ml.training.build_training_dataset import build_training_dataset
        ds_summary = build_training_dataset()
        logging.info(f"Dataset built: {ds_summary}")
    except Exception as e:
        ds_summary = {"error": str(e)}
        logging.error(f"Dataset build failed: {e}")
        print(f"  [FAILED] Dataset build: {e}")

    results = {"dataset": ds_summary, "models": {}}

    # ---- Step 2a: ranking model (the job-matching brain) ----------------
    print("\n[2/4] Training candidate ranking model...")
    try:
        from ml.training.train_ranking_model import train_ranking_model
        m = train_ranking_model()
        results["models"]["ranking"] = m
        logging.info(f"Ranking model: {m.get('status')}")
    except Exception as e:
        results["models"]["ranking"] = {"status": "FAILED", "error": str(e)}
        logging.error(f"Ranking training failed: {e}")
        print(f"  [FAILED] Ranking model: {e}")

    # ---- Step 2b: remaining models (each isolated) ----------------------
    steps = [
        ("matching", "ml.training.train_matching_model", "train_matching_model"),
        ("skill_extractor", "ml.training.train_skill_extractor", "train_skill_extractor"),
        ("forecasting", "ml.training.train_forecasting_model", "train_forecasting"),
    ]
    total = len(steps)
    for i, (name, mod_path, fn_name) in enumerate(steps, start=2):
        print(f"\n[{i}/4] Training {name}...")
        try:
            module = __import__(mod_path, fromlist=[fn_name])
            fn = getattr(module, fn_name)
            m = fn()
            results["models"][name] = m if isinstance(m, dict) else {"status": "done"}
            logging.info(f"{name}: done")
        except Exception as e:
            results["models"][name] = {"status": "FAILED", "error": str(e)}
            logging.error(f"{name} training failed: {e}")
            print(f"  [FAILED] {name}: {e}")

    # ---- Step 3: register versions ---------------------------------------
    print("\n[3/4] Registering model versions...")
    try:
        from app.database import SessionLocal
        db = SessionLocal()
        rank_m = results["models"].get("ranking", {})
        if rank_m.get("version"):
            ok = register_model_version(db, "candidate_ranker",
                                        rank_m["version"], rank_m)
            print(f"  candidate_ranker {rank_m['version']}: "
                  f"{'registered' if ok else 'registration skipped'}")
        db.close()
    except Exception as e:
        logging.error(f"Version registration failed: {e}")

    # ---- Step 4: summary ---------------------------------------------------
    results["finished_at"] = datetime.now().isoformat()
    results["duration_seconds"] = round((datetime.now() - started).total_seconds(), 1)
    summary_file = os.path.join(LOG_DIR, "last_retrain_summary.json")
    with open(summary_file, "w") as f:
        json.dump(results, f, indent=2, default=str)

    print("\n" + "=" * 56)
    print("RETRAIN COMPLETE")
    for name, m in results["models"].items():
        print(f"  {name:<16} -> {m.get('status', '?')}"
              + (f" | F1={m['F1']}" if m.get("F1") is not None else ""))
    print(f"Summary saved -> {summary_file}")
    print("=" * 56)
    return results


if __name__ == "__main__":
    main()