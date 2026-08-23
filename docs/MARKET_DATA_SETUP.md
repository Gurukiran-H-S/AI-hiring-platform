# AI Job Market Intelligence & Technology Trend Analyzer Setup

This guide explains how to configure, operate, and troubleshoot the **AI Job Market Intelligence** module in HireAI.

---

## 1. Overview

The AI Job Market Intelligence system tracks technology demand, daily growth %, 7-day/30-day trends, and future demand forecasts across three data tiers:
1. **Job Market Feeds** (Primary hiring demand signal): Ingests listings from RemoteOK, Arbeitnow, Adzuna, and internal database postings.
2. **GitHub Developer Ecosystem** (Secondary ecosystem activity signal): Measures language/repository creation, stars, and commit frequency via the GitHub REST API.
3. **Google Trends / Search Interest** (Optional search interest signal): Measures developer learning and adoption search indices.

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env` in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

Add or adjust the following variables:

```env
# Enable or disable data sources
MARKET_DATA_ENABLED=true
MARKET_DATA_PROVIDER=remoteok,arbeitnow,adzuna,internal
MARKET_API_KEY=

# GitHub REST API Token (Optional: provides 5,000 req/hr instead of 60 req/hr)
GITHUB_ENABLED=true
GITHUB_TOKEN=ghp_yourPersonalAccessTokenHere

# Google Trends API (Optional)
GOOGLE_TRENDS_ENABLED=false
GOOGLE_TRENDS_API_KEY=

# Scheduled Collection Frequency (in seconds: 86400 = 24 hours)
MARKET_COLLECTION_INTERVAL=86400
```

---

## 3. How to Obtain API Credentials

### A. GitHub Personal Access Token (Free)
1. Go to [GitHub Settings → Developer Settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens).
2. Generate a new token with `public_repo` and `read:org` read-only scopes.
3. Paste the token into `GITHUB_TOKEN=ghp_...` in your `backend/.env`.

### B. Adzuna Job API (Optional Free Tier)
1. Register at [Adzuna Developer Portal](https://developer.adzuna.com/).
2. Obtain your `APP_ID` and `APP_KEY`.
3. Set `MARKET_API_KEY=your_adzuna_key` in `.env`.

### C. RemoteOK & Arbeitnow
* RemoteOK and Arbeitnow public feeds are supported out-of-the-box without requiring API keys.

---

## 4. Scheduling & Frequency Customization

By default, data collection is scheduled to execute daily at **02:00 AM server time** or based on `MARKET_COLLECTION_INTERVAL`:

* **Daily (Default)**: `MARKET_COLLECTION_INTERVAL=86400`
* **Every 12 Hours**: `MARKET_COLLECTION_INTERVAL=43200`
* **Every 6 Hours**: `MARKET_COLLECTION_INTERVAL=21600`

---

## 5. Manual On-Demand Data Refresh

Admins can trigger an instant market analysis at any time via:
- **Admin Dashboard**: Clicking the **`[⚡ Refresh Market Data]`** button.
- **REST API**:
  ```bash
  curl -X POST "http://localhost:8000/api/market/refresh" \
    -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
  ```

---

## 6. Failure Isolation & Stale Data Handling

* If an external API is down or rate-limited, the system **never crashes** and never deletes previous successful historical snapshots.
* The system logs the failure in `data_source_status` and falls back gracefully to latest verified records.
* The frontend displays a freshness warning if data exceeds the freshness threshold (e.g. `⚠ Market data was updated 18 hours ago`).

---

## 7. HireAI Technology Demand Score Formula

$$\text{Demand Score} = (\text{Job Posting Demand} \times 0.60) + (\text{GitHub Activity} \times 0.25) + (\text{Search Interest} \times 0.15)$$

* When an optional provider (e.g. Google Trends) is disabled, the remaining active weights are dynamically re-normalized (e.g. $70\% \text{ Jobs} + 30\% \text{ GitHub}$).
