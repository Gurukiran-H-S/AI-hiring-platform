# AI Hiring Platform - Market Intelligence & Forecasting

## Overview

The Market Intelligence engine collects, normalizes, aggregates, and forecasts tech industry hiring demands and technology skill trends.

---

## Data Pipeline

### 1. Collectors (`app.services.market_data`)
- **`job_source.py`**: Ingests active job postings from the PostgreSQL database and external job APIs.
- **`github_source.py`**: Queries GitHub trending repositories to capture rising developer technologies.
- **`trends_source.py`**: Ingests macro developer survey indicators.

### 2. Normalization (`app.services.market_data.normalizer.py`)
- Standardizes technology variants into canonical taxonomy categories:
  - *Languages, Frontend, Backend, Databases, Cloud & DevOps, AI/ML, Mobile, Security*

### 3. Forecasting Engine (`app.services.market_data.forecaster.py`)
- Utilizes **Holt-Winters Exponential Smoothing** on historical time-series datasets to calculate:
  - Projected demand per 1,000 job postings
  - Monthly growth rate percentage
  - Confidence interval levels
  - Emerging role trajectory indicators

---

## Automated Ingestion Scheduler

The market data scheduler (`app.services.market_data.scheduler.py`) runs periodically on application startup to maintain fresh snapshots in the `market_snapshots` table.
