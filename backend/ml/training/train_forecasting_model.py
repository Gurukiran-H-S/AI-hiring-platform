"""
Skill Demand Time-Series Forecasting Model - REAL training.

Input : data/historical_jobs/historical_jobs.csv  (month,skill,demand_count)
        Built by ml/training/build_historical_jobs.py from real LinkedIn
        job postings; extended monthly as the platform collects its own data.

Method: Holt-Winters exponential smoothing (trend, no seasonality for short
        series) per skill via statsmodels. Honest backtest: last observed
        month is held out, metrics (MAE / RMSE / MAPE) computed on it.
        No fabricated numbers anywhere.

Output: ml/models/forecasting/forecast_model.pkl  (bundle with fitted models)
        ml/models/forecasting/metrics.json
"""

import os
import sys
import json
import warnings
from datetime import datetime

import joblib
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

MODEL_DIR = os.path.join("ml", "models", "forecasting")
METRICS_FILE = os.path.join(MODEL_DIR, "metrics.json")
MODEL_FILE = os.path.join(MODEL_DIR, "forecast_model.pkl")
DATA_FILE = os.path.join("data", "historical_jobs", "historical_jobs.csv")

MIN_MONTHS = 4          # absolute minimum to fit a trend
HORIZON = 3             # months to forecast ahead


def _fit_series(values: list):
    """Fit Holt damped-trend smoothing on one skill's monthly counts."""
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    y = np.asarray(values, dtype=float)
    model = ExponentialSmoothing(
        y,
        trend="add",
        damped_trend=True,
        initialization_method="estimated",
    )
    return model.fit(optimized=True)


def train_forecasting() -> dict:
    print("=" * 50)
    print("SKILL DEMAND FORECASTING MODEL TRAINING")
    print("=" * 50)

    os.makedirs(MODEL_DIR, exist_ok=True)
    now = datetime.now()

    if not os.path.exists(DATA_FILE):
        msg = f"No historical time-series found at {DATA_FILE}. Run ml.training.build_historical_jobs first."
        print(f"  [SKIPPED] {msg}")
        metrics = {"status": "SKIPPED_INSUFFICIENT_DATA", "reason": msg, "trained_at": now.isoformat()}
        joblib.dump({"type": "moving_average_baseline", "reason": msg}, MODEL_FILE)
        with open(METRICS_FILE, "w") as f:
            json.dump(metrics, f, indent=4)
        return metrics

    df = pd.read_csv(DATA_FILE)

    # Normalize into "mentions per 1,000 postings" so differently-sized
    # source datasets (124K-posting 2024 dump vs 1K-posting 2025 set)
    # become comparable. Without this, source size masquerades as trend.
    totals_file = os.path.join("data", "historical_jobs", "month_totals.json")
    month_totals = {}
    if os.path.exists(totals_file):
        with open(totals_file) as f:
            month_totals = json.load(f)

    if month_totals:
        df["demand_rate"] = df.apply(
            lambda r: r["demand_count"] / max(1, month_totals.get(r["month"], 0)) * 1000.0,
            axis=1,
        )
        value_col = "demand_rate"
        unit = "per-1k-postings"
    else:
        value_col = "demand_count"
        unit = "raw-count"

    pivot = df.pivot_table(index="month", columns="skill",
                           values=value_col, aggfunc="sum").sort_index()
    n_months = len(pivot)

    if n_months < MIN_MONTHS:
        msg = f"Only {n_months} months of history (need >= {MIN_MONTHS})."
        print(f"  [SKIPPED] {msg} Keeping moving-average baseline.")
        metrics = {"status": "SKIPPED_INSUFFICIENT_DATA", "reason": msg, "trained_at": now.isoformat()}
        joblib.dump({"type": "moving_average_baseline", "reason": msg}, MODEL_FILE)
        with open(METRICS_FILE, "w") as f:
            json.dump(metrics, f, indent=4)
        return metrics

    # ---- Train one Holt model per skill ---------------------------------
    warnings.filterwarnings("ignore")
    models, per_skill = {}, {}
    for skill in pivot.columns:
        series = pivot[skill].dropna()
        if len(series) < MIN_MONTHS or series.sum() < 5:
            continue  # not enough signal to forecast meaningfully
        try:
            fit = _fit_series(series.values.tolist())
            fc = fit.forecast(HORIZON)
            models[skill] = {
                "params": {
                    "alpha": float(fit.params["smoothing_level"]),
                    "beta": float(fit.params["smoothing_trend"]),
                    "phi": float(fit.params.get("damping_trend", 1.0)),
                    "level": float(fit.params["initial_level"]),
                    "slope": float(fit.params.get("initial_slope",
                                                 fit.params.get("initial_trend", 0.0))),
                },
                "last_month": str(series.index[-1]),
                "history": [float(v) for v in series.values],
                # Precomputed next-HORIZON-month demand projection
                "forecast": [round(max(0.0, float(v)), 1) for v in fc],
            }
            per_skill[skill] = {"months": int(len(series)), "total_demand": int(series.sum())}
        except Exception:
            continue

    if not models:
        msg = "No skill had enough signal to fit a trend model."
        print(f"  [SKIPPED] {msg}")
        metrics = {"status": "SKIPPED_INSUFFICIENT_DATA", "reason": msg, "trained_at": now.isoformat()}
        joblib.dump({"type": "moving_average_baseline", "reason": msg}, MODEL_FILE)
        with open(METRICS_FILE, "w") as f:
            json.dump(metrics, f, indent=4)
        return metrics

    # ---- Honest backtest: hold out the final month ----------------------
    maes, mapes, evaluated = [], [], 0
    for skill in models:
        series = pivot[skill].dropna()
        if len(series) < MIN_MONTHS + 1:
            continue  # cannot backtest and still have a trend window
        train_vals = series.values[:-1]
        actual = float(series.values[-1])
        try:
            bt_fit = _fit_series(train_vals.tolist())
            pred = max(0.0, float(bt_fit.forecast(1)[0]))
            maes.append(abs(pred - actual))
            if actual > 0:
                mapes.append(abs(pred - actual) / actual * 100.0)
            evaluated += 1
        except Exception:
            continue

    mae = round(float(np.mean(maes)), 2) if maes else None
    mape = round(float(np.mean(mapes)), 1) if mapes else None
    rmse = round(float(np.sqrt(np.mean([m ** 2 for m in maes]))), 2) if maes else None

    # ---- Final refit on full history + persist --------------------------
    bundle = {
        "type": "holt_damped_trend",
        "version": now.strftime("v%Y%m%d_%H%M%S"),
        "trained_at": now.isoformat(),
        "horizon_months": HORIZON,
        "unit": unit,
        "skills": models,
        "backtest": {"evaluated_skills": evaluated},
    }
    joblib.dump(bundle, MODEL_FILE)

    metrics = {
        "status": "SUCCESS",
        "model_type": "HoltWinters_damped_trend_per_skill",
        "version": bundle["version"],
        "trained_at": now.isoformat(),
        "history_months": int(n_months),
        "date_range": f"{pivot.index[0]}..{pivot.index[-1]}",
        "demand_unit": unit,
        "normalized": bool(month_totals),
        "short_history": n_months < 12,
        "skills_trained": sorted(models.keys()),
        "backtest_evaluated_skills": evaluated,
        "MAE": mae,
        "RMSE": rmse,
        "MAPE": mape,
        "note": "Backtest holds out the most recent month; short histories make these wide.",
    }
    with open(METRICS_FILE, "w") as f:
        json.dump(metrics, f, indent=4)

    print(f"  [SUCCESS] Trained {len(models)} skill models | backtested {evaluated}"
          + (f" | MAE={mae} MAPE={mape}%" if mae is not None else ""))
    print(f"  [SUCCESS] Saved -> {MODEL_FILE}")
    return metrics


if __name__ == "__main__":
    train_forecasting()