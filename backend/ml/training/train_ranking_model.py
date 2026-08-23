"""
Train the candidate ranking model (selection predictor).

- Consumes data/processed/feedback_training.csv produced by
  ml/training/build_training_dataset.py (run monthly by the retrain pipeline).
- Labels come from REAL recruiter decisions when available, otherwise from
  clearly-marked bootstrap weak labels.
- Metrics are computed on a held-out test split - never fabricated.
"""

import os
import sys
import json
import joblib
from datetime import datetime

import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
)

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

MODEL_DIR = os.path.join("ml", "models", "ranking")
METRICS_FILE = os.path.join(MODEL_DIR, "ranking_metrics.json")
MODEL_FILE = os.path.join(MODEL_DIR, "candidate_ranker.joblib")
DATA_FILE = os.path.join("data", "processed", "feedback_training.csv")

FEATURES = [
    "ats_score", "skill_score", "keyword_score", "semantic_score",
    "experience_score", "education_score", "project_score",
    "coding_score", "aptitude_score", "interview_score",
]
MIN_SAMPLES = 20


def _existing_model_version():
    try:
        if os.path.exists(MODEL_FILE):
            old = joblib.load(MODEL_FILE)
            if isinstance(old, dict):
                return old.get("version")
    except Exception:
        pass
    return None


def train_ranking_model(force_stub: bool = False) -> dict:
    print("=" * 50)
    print("CANDIDATE RANKING MODEL TRAINING")
    print("=" * 50)

    os.makedirs(MODEL_DIR, exist_ok=True)
    now = datetime.now()

    # ---- Load data ------------------------------------------------------
    df = None
    if not force_stub and os.path.exists(DATA_FILE):
        try:
            df = pd.read_csv(DATA_FILE)
        except Exception as e:
            print(f"  [WARN] Could not read {DATA_FILE}: {e}")

    if df is None or len(df) < MIN_SAMPLES or df["selected"].nunique() < 2:
        reason = (
            f"insufficient or single-class data ({0 if df is None else len(df)} rows, "
            f"need >= {MIN_SAMPLES} with both classes)"
        )
        print(f"  [SKIPPED] {reason}. Saving rule-based fallback stub.")
        stub = {
            "model": None,
            "features": FEATURES,
            "type": "rule_based_fallback",
            "version": f"stub-{now.strftime('%Y%m%d')}",
            "trained_at": now.isoformat(),
            "reason": reason,
        }
        joblib.dump(stub, MODEL_FILE)
        metrics = {
            "status": "SKIPPED_INSUFFICIENT_DATA",
            "reason": reason,
            "version": stub["version"],
            "trained_at": now.isoformat(),
        }
        with open(METRICS_FILE, "w") as f:
            json.dump(metrics, f, indent=4)
        return metrics

    # ---- Train ----------------------------------------------------------
    X, y = df[FEATURES], df["selected"].astype(int)
    strat = y if y.nunique() > 1 else None
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=strat
    )

    model = GradientBoostingClassifier(
        n_estimators=200, learning_rate=0.08, max_depth=3,
        subsample=0.9, random_state=42,
    )
    model.fit(X_tr, y_tr)

    # ---- Honest evaluation on held-out split ----------------------------
    y_pred = model.predict(X_te)
    metrics = {
        "status": "SUCCESS",
        "model_type": "GradientBoostingClassifier",
        "n_samples": int(len(df)),
        "train_samples": int(len(X_tr)),
        "test_samples": int(len(X_te)),
        "positive_rate": round(float(y.mean()), 3),
        "accuracy": round(float(accuracy_score(y_te, y_pred)), 4),
        "precision": round(float(precision_score(y_te, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_te, y_pred, zero_division=0)), 4),
        "F1": round(float(f1_score(y_te, y_pred, zero_division=0)), 4),
    }
    try:
        metrics["ROC_AUC"] = round(float(roc_auc_score(y_te, model.predict_proba(X_te)[:, 1])), 4)
    except Exception:
        metrics["ROC_AUC"] = None

    # 5-fold CV only when enough samples per class
    if len(df) >= 50 and y.value_counts().min() >= 5 and strat is not None:
        try:
            cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
            cv_f1 = cross_val_score(model, X, y, cv=cv, scoring="f1")
            metrics["cv_f1_mean"] = round(float(cv_f1.mean()), 4)
            metrics["cv_f1_std"] = round(float(cv_f1.std()), 4)
        except Exception:
            pass

    # Feature importances (explainability)
    try:
        importance = sorted(
            zip(FEATURES, model.feature_importances_.round(4).tolist()),
            key=lambda t: -t[1],
        )
        metrics["feature_importance"] = dict(importance)
    except Exception:
        pass

    # ---- Persist versioned bundle ---------------------------------------
    prev_version = _existing_model_version()
    bundle = {
        "model": model,
        "features": FEATURES,
        "type": "gradient_boosting_ranker",
        "version": now.strftime("v%Y%m%d_%H%M%S"),
        "previous_version": prev_version,
        "trained_at": now.isoformat(),
        "metrics": {k: v for k, v in metrics.items() if k != "feature_importance"},
    }
    joblib.dump(bundle, MODEL_FILE)

    metrics["version"] = bundle["version"]
    metrics["previous_version"] = prev_version
    metrics["trained_at"] = now.isoformat()

    with open(METRICS_FILE, "w") as f:
        json.dump(metrics, f, indent=4)

    print(f"  [SUCCESS] Trained on {len(df)} samples | F1={metrics['F1']} "
          f"| Accuracy={metrics['accuracy']}")
    print(f"  [SUCCESS] Saved model -> {MODEL_FILE}")
    return metrics


if __name__ == "__main__":
    train_ranking_model()