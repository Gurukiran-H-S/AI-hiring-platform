"""
Time-Series Forecasting Engine for Technology Demand.
Produces 7-day, 30-day, and 90-day future demand predictions based on historical daily snapshots.
"""

import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session

from app.models.market import TechnologyDailySnapshot, MarketForecast, TechnologyTrend


class MarketForecaster:
    """Lightweight time-series forecasting using Ordinary Least Squares (OLS) Linear Trend Regression."""

    @staticmethod
    def generate_forecasts(db: Session) -> Dict[str, Any]:
        """Compute 7d, 30d, and 90d demand projections for all active technologies."""
        trends = db.query(TechnologyTrend).all()
        forecasts_created = 0
        insufficient_data_techs = []

        # Current date
        now = datetime.utcnow()

        for t in trends:
            tech_name = t.technology

            # Retrieve historical daily snapshots ordered by date ascending
            snapshots = (
                db.query(TechnologyDailySnapshot)
                .filter(TechnologyDailySnapshot.technology == tech_name)
                .order_by(TechnologyDailySnapshot.snapshot_date.asc())
                .all()
            )

            # Require at least 3 historical snapshot points to perform authentic time-series regression
            if len(snapshots) < 3:
                insufficient_data_techs.append(tech_name)
                # If only 1-2 points exist, calculate baseline projection without fabricating precision
                base_score = t.demand_score or 50.0
                growth_rate = (t.growth_7d or 0.0) / 100.0

                for days, horizon in [(7, "7d"), (30, "30d"), (90, "90d")]:
                    target_date = (now + timedelta(days=days)).strftime("%Y-%m-%d")
                    # Simple moderated growth assumption with decay
                    factor = 1.0 + (growth_rate * (days / 30.0) * 0.5)
                    predicted = round(max(5.0, min(99.0, base_score * factor)), 1)

                    db.query(MarketForecast).filter(
                        MarketForecast.technology == tech_name,
                        MarketForecast.forecast_horizon == horizon
                    ).delete()

                    forecast_rec = MarketForecast(
                        technology=tech_name,
                        forecast_horizon=horizon,
                        forecast_date=target_date,
                        predicted_demand=predicted,
                        lower_bound=round(max(0.0, predicted - 4.5), 1),
                        upper_bound=round(min(100.0, predicted + 4.5), 1),
                        confidence_level="Moderate (Baseline Prior)",
                        model_name="BaselineTrendExtrapolator",
                        generated_at=now
                    )
                    db.add(forecast_rec)
                    forecasts_created += 1
                continue

            # Linear regression: x = day index (0, 1, 2, ...), y = demand_score
            n = len(snapshots)
            x_vals = list(range(n))
            y_vals = [s.demand_score for s in snapshots]

            x_mean = sum(x_vals) / n
            y_mean = sum(y_vals) / n

            # Slope (m) and Intercept (c)
            numerator = sum((x_vals[i] - x_mean) * (y_vals[i] - y_mean) for i in range(n))
            denominator = sum((x_vals[i] - x_mean) ** 2 for i in range(n))

            slope = (numerator / denominator) if denominator != 0 else 0.0
            intercept = y_mean - (slope * x_mean)

            # Residual standard deviation for confidence bounds
            residuals = [(y_vals[i] - (slope * x_vals[i] + intercept)) ** 2 for i in range(n)]
            std_err = math.sqrt(sum(residuals) / max(1, n - 2)) if n > 2 else 2.0

            for days, horizon in [(7, "7d"), (30, "30d"), (90, "90d")]:
                target_date = (now + timedelta(days=days)).strftime("%Y-%m-%d")
                # Future x index (assuming daily cadence)
                future_x = n - 1 + days
                raw_pred = slope * future_x + intercept

                # Bound between 1.0 and 99.0
                pred = round(max(1.0, min(99.0, raw_pred)), 1)
                bound_margin = round(std_err * 1.96 * math.sqrt(1 + (1 / n) + ((future_x - x_mean) ** 2) / max(1, denominator)), 1)
                lower_b = round(max(0.0, pred - bound_margin), 1)
                upper_b = round(min(100.0, pred + bound_margin), 1)

                db.query(MarketForecast).filter(
                    MarketForecast.technology == tech_name,
                    MarketForecast.forecast_horizon == horizon
                ).delete()

                forecast_rec = MarketForecast(
                    technology=tech_name,
                    forecast_horizon=horizon,
                    forecast_date=target_date,
                    predicted_demand=pred,
                    lower_bound=lower_b,
                    upper_bound=upper_b,
                    confidence_level="High (OLS Regression)" if n >= 7 else "Moderate (Historical Trend)",
                    model_name="LinearTrendRegressor",
                    generated_at=now
                )
                db.add(forecast_rec)
                forecasts_created += 1

        db.commit()
        return {
            "forecasts_created": forecasts_created,
            "insufficient_data_techs_count": len(insufficient_data_techs),
            "generated_at": now.isoformat()
        }


market_forecaster = MarketForecaster()
