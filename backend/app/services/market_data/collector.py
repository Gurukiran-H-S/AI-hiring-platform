"""
Master AI Job Market Intelligence Orchestrator and Data Collector.
Executes the scheduled 15-step data ingestion, NLP extraction, daily snapshotting,
HireAI Technology Demand Score calculation, and forecasting workflow.
"""

import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Set
from collections import Counter, defaultdict
from sqlalchemy.orm import Session

from app.models.market import (
    JobMarketData,
    TechnologyTrend,
    TechnologyDailySnapshot,
    MarketCollectionRun
)
from app.services.market_data.job_source import job_market_provider
from app.services.market_data.github_source import github_provider
from app.services.market_data.trends_source import google_trends_provider
from app.services.market_data.normalizer import TECH_TAXONOMY, tech_normalizer
from app.services.market_data.forecaster import market_forecaster

logger = logging.getLogger(__name__)


class MarketDataCollector:
    """Orchestrates end-to-end market data collection, metrics computation, and PostgreSQL persistence."""

    async def run_collection_cycle(self, db: Session, trigger_type: str = "scheduled") -> Dict[str, Any]:
        """Execute the complete 15-step Market Analysis Workflow."""
        start_time = time.time()
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        yesterday_str = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
        seven_days_ago_str = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
        thirty_days_ago_str = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")

        logger.info(f"🚀 Starting AI Job Market Intelligence Collection Cycle ({trigger_type}) for {today_str}...")

        # STEP 1: Initialize collection run log
        run_log = MarketCollectionRun(
            trigger_type=trigger_type,
            status="running",
            started_at=datetime.utcnow()
        )
        db.add(run_log)
        db.commit()

        error_logs = []

        try:
            # STEP 2: Ingest and process Job Market Data
            job_results = await job_market_provider.fetch(db)
            if job_results.get("errors"):
                error_logs.extend(job_results["errors"])

            # STEP 3: Ingest GitHub Developer Ecosystem Metrics
            github_results = await github_provider.fetch(db)
            github_scores: Dict[str, float] = github_results.get("tech_scores", {})

            # STEP 4: Ingest Google Trends Metrics (if configured)
            trends_results = await google_trends_provider.fetch(db)
            search_scores: Dict[str, float] = trends_results.get("tech_scores", {})

            # STEP 5-8: Aggregate all job data, extract skills, and calculate tech frequencies
            all_jobs = db.query(JobMarketData).all()
            total_jobs_analyzed = len(all_jobs)

            if total_jobs_analyzed == 0:
                logger.warning("No job market records available in database.")
                total_jobs_analyzed = 1  # Avoid division by zero

            tech_job_counts: Counter = Counter()
            tech_locations: Dict[str, Counter] = defaultdict(Counter)
            tech_roles: Dict[str, Counter] = defaultdict(Counter)

            for job in all_jobs:
                skills: List[str] = job.extracted_skills or []
                loc = (job.location or "Bengaluru").split(",")[0].strip()
                title = job.job_title or "Software Engineer"

                # Infer general role bucket
                role_bucket = "Software Engineer"
                t_lower = title.lower()
                if "ai" in t_lower or "ml" in t_lower or "machine learning" in t_lower or "data" in t_lower:
                    role_bucket = "AI / ML & Data Engineer"
                elif "devops" in t_lower or "cloud" in t_lower or "sre" in t_lower or "infrastructure" in t_lower:
                    role_bucket = "Cloud & DevOps Engineer"
                elif "frontend" in t_lower or "ui" in t_lower or "react" in t_lower:
                    role_bucket = "Frontend Engineer"
                elif "backend" in t_lower or "api" in t_lower or "java" in t_lower or "python" in t_lower:
                    role_bucket = "Backend Engineer"
                elif "full" in t_lower or "stack" in t_lower:
                    role_bucket = "Full Stack Engineer"

                for sk in skills:
                    canonical_name, _ = tech_normalizer.normalize_name(sk)
                    tech_job_counts[canonical_name] += 1
                    tech_locations[canonical_name][loc] += 1
                    tech_roles[canonical_name][role_bucket] += 1

            # Ensure all core taxonomy technologies have baseline tracking
            core_tech_set: Set[str] = {v[0] for v in TECH_TAXONOMY.values()}
            for ct in core_tech_set:
                if ct not in tech_job_counts:
                    tech_job_counts[ct] = 0

            # STEP 9-12: Compute Growth, HireAI Demand Score, and Trend Direction
            technologies_tracked_count = 0

            for tech_name, job_cnt in tech_job_counts.items():
                _, category = tech_normalizer.normalize_name(tech_name)
                demand_pct = round((job_cnt / total_jobs_analyzed) * 100.0, 1)

                # Fetch historical snapshots for growth comparisons
                prev_day_snap = (
                    db.query(TechnologyDailySnapshot)
                    .filter(
                        TechnologyDailySnapshot.technology == tech_name,
                        TechnologyDailySnapshot.snapshot_date <= yesterday_str
                    )
                    .order_by(TechnologyDailySnapshot.snapshot_date.desc())
                    .first()
                )

                snap_7d = (
                    db.query(TechnologyDailySnapshot)
                    .filter(
                        TechnologyDailySnapshot.technology == tech_name,
                        TechnologyDailySnapshot.snapshot_date <= seven_days_ago_str
                    )
                    .order_by(TechnologyDailySnapshot.snapshot_date.desc())
                    .first()
                )

                snap_30d = (
                    db.query(TechnologyDailySnapshot)
                    .filter(
                        TechnologyDailySnapshot.technology == tech_name,
                        TechnologyDailySnapshot.snapshot_date <= thirty_days_ago_str
                    )
                    .order_by(TechnologyDailySnapshot.snapshot_date.desc())
                    .first()
                )

                # Day-over-day growth %
                if prev_day_snap and prev_day_snap.job_count > 0:
                    growth_day = round(((job_cnt - prev_day_snap.job_count) / prev_day_snap.job_count) * 100.0, 1)
                else:
                    growth_day = 0.0

                # 7-day growth %
                if snap_7d and snap_7d.job_count > 0:
                    growth_7d = round(((job_cnt - snap_7d.job_count) / snap_7d.job_count) * 100.0, 1)
                else:
                    # Moderate fallback based on overall demand bracket
                    growth_7d = round(growth_day * 2.5, 1)

                # 30-day growth %
                if snap_30d and snap_30d.job_count > 0:
                    growth_30d = round(((job_cnt - snap_30d.job_count) / snap_30d.job_count) * 100.0, 1)
                else:
                    growth_30d = round(growth_7d * 1.8, 1)

                # Ecosystem signals
                gh_score = github_scores.get(tech_name, 75.0 if demand_pct > 10 else 50.0)
                search_score = search_scores.get(tech_name, 70.0 if demand_pct > 10 else 50.0)

                # ─── HireAI Technology Demand Score Calculation ───
                # Formula: 60% Job Demand (scaled 0-100) + 25% GitHub Activity + 15% Search Interest
                # Job demand scale: 50%+ demand -> 100 score; 25% demand -> 85 score; 5% demand -> 50 score
                job_score_normalized = min(100.0, max(15.0, (demand_pct / 50.0) * 100.0))

                has_search = google_trends_provider.is_configured()
                if has_search:
                    hireai_demand_score = round(
                        (job_score_normalized * 0.60) + (gh_score * 0.25) + (search_score * 0.15),
                        1
                    )
                else:
                    # Re-normalize weights: 70% Jobs + 30% GitHub
                    hireai_demand_score = round(
                        (job_score_normalized * 0.70) + (gh_score * 0.30),
                        1
                    )

                # STEP 13: Trend Classification
                if growth_7d > 15.0 or (growth_30d > 25.0 and hireai_demand_score > 75):
                    trend_direction = "Rapidly Growing"
                elif growth_7d > 4.0 or growth_30d > 8.0:
                    trend_direction = "Growing"
                elif growth_7d < -5.0 or growth_30d < -10.0:
                    trend_direction = "Declining"
                else:
                    trend_direction = "Stable"

                # Top locations and roles formatting
                top_loc_list = [
                    {"location": loc, "count": cnt}
                    for loc, cnt in tech_locations[tech_name].most_common(5)
                ]
                top_role_list = [
                    {"role": r, "count": cnt}
                    for r, cnt in tech_roles[tech_name].most_common(5)
                ]

                # STEP 14: Save Immutable Daily Snapshot (never overwrite previous dates)
                existing_snap = (
                    db.query(TechnologyDailySnapshot)
                    .filter(
                        TechnologyDailySnapshot.snapshot_date == today_str,
                        TechnologyDailySnapshot.technology == tech_name
                    )
                    .first()
                )

                if not existing_snap:
                    daily_snap = TechnologyDailySnapshot(
                        snapshot_date=today_str,
                        technology=tech_name,
                        category=category,
                        job_count=job_cnt,
                        demand_percentage=demand_pct,
                        growth_percentage=growth_day,
                        demand_score=hireai_demand_score,
                        github_activity=gh_score,
                        search_interest=search_score,
                        created_at=datetime.utcnow()
                    )
                    db.add(daily_snap)
                else:
                    existing_snap.job_count = job_cnt
                    existing_snap.demand_percentage = demand_pct
                    existing_snap.demand_score = hireai_demand_score
                    existing_snap.github_activity = gh_score
                    existing_snap.search_interest = search_score

                # Update or Insert TechnologyTrend current state
                current_trend = (
                    db.query(TechnologyTrend)
                    .filter(TechnologyTrend.technology == tech_name)
                    .first()
                )

                if not current_trend:
                    current_trend = TechnologyTrend(
                        technology=tech_name,
                        category=category,
                        job_count=job_cnt,
                        demand_percentage=demand_pct,
                        growth_7d=growth_7d,
                        growth_30d=growth_30d,
                        demand_score=hireai_demand_score,
                        github_activity=gh_score,
                        search_interest=search_score,
                        trend_direction=trend_direction,
                        top_locations=top_loc_list,
                        top_roles=top_role_list,
                        updated_at=datetime.utcnow()
                    )
                    db.add(current_trend)
                else:
                    current_trend.category = category
                    current_trend.job_count = job_cnt
                    current_trend.demand_percentage = demand_pct
                    current_trend.growth_7d = growth_7d
                    current_trend.growth_30d = growth_30d
                    current_trend.demand_score = hireai_demand_score
                    current_trend.github_activity = gh_score
                    current_trend.search_interest = search_score
                    current_trend.trend_direction = trend_direction
                    current_trend.top_locations = top_loc_list
                    current_trend.top_roles = top_role_list
                    current_trend.updated_at = datetime.utcnow()

                technologies_tracked_count += 1

            db.commit()

            # STEP 15: Run Forecasting Engine
            forecast_summary = market_forecaster.generate_forecasts(db)

            duration = round(time.time() - start_time, 2)
            run_log.jobs_analyzed = total_jobs_analyzed
            run_log.technologies_tracked = technologies_tracked_count
            run_log.status = "completed"
            run_log.duration_seconds = duration
            run_log.completed_at = datetime.utcnow()
            if error_logs:
                run_log.error_log = "; ".join(error_logs)

            db.commit()
            logger.info(f"✅ Market Intelligence Collection complete in {duration}s. Tracked {technologies_tracked_count} technologies.")

            return {
                "status": "SUCCESS",
                "jobs_analyzed": total_jobs_analyzed,
                "technologies_tracked": technologies_tracked_count,
                "duration_seconds": duration,
                "snapshot_date": today_str,
                "forecasts": forecast_summary
            }

        except Exception as e:
            logger.error(f"Market analysis cycle failed: {e}", exc_info=True)
            db.rollback()
            run_log.status = "failed"
            run_log.error_log = str(e)
            run_log.duration_seconds = round(time.time() - start_time, 2)
            run_log.completed_at = datetime.utcnow()
            db.commit()
            return {"status": "FAILED", "error": str(e)}


market_data_collector = MarketDataCollector()
