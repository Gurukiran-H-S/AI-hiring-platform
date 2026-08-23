# AI Hiring & Candidate Evaluation Platform - Architecture

## System Overview

The **AI Hiring & Candidate Evaluation Platform** is an enterprise-grade AI recruiting and assessment ecosystem designed to provide unbiased, deterministic, and multi-pillar candidate evaluations.

```
                    ┌────────────────────────┐
                    │  Frontend (React 18)   │
                    │   Vite + TailwindCSS   │
                    └───────────┬────────────┘
                                │ REST APIs (JSON / JWT)
                                ▼
                    ┌────────────────────────┐
                    │  Backend (FastAPI)     │
                    │   Uvicorn + Pydantic   │
                    └─────┬───────────┬──────┘
                          │           │
           ┌──────────────┴───┐   ┌───┴────────────────┐
           │ AI / ML Services │   │ Execution Sandbox  │
           │  spaCy + PyTorch │   │ Docker / Subproc   │
           └──────────────┬───┘   └───┬────────────────┘
                          │           │
                          ▼           ▼
                    ┌────────────────────────┐
                    │  PostgreSQL Database   │
                    │  SQLAlchemy + Alembic  │
                    └────────────────────────┘
```

---

## Architectural Layers

### 1. Presentation Layer (Frontend)
- **Framework**: React 18, Vite 5, Tailwind CSS
- **Code Editor**: Monaco Editor with multi-language code completion (Python, JavaScript, Java, C++)
- **Authentication**: JWT Bearer token management with automated Axios interceptors and silent token refresh
- **Role Portals**:
  - `/candidate/*`: Resume Analysis, Coding Playground, Aptitude Testing, AI Mock Interview, Job Search & Tracker, Market Intelligence, QR Candidate Profile
  - `/recruiter/*`: Job Postings, Deterministic 4-Pillar Ranking, Weight Configuration, Score Breakdown, Side-by-Side Candidate Comparison, Interview Scheduler
  - `/admin/*`: User Management, System Analytics, Live Database Viewer, Market Trend Aggregates

### 2. Application Layer (Backend API)
- **Framework**: FastAPI with asynchronous routing and Pydantic validation
- **Routers**:
  - `auth`: Candidate, Recruiter, Admin registration, login, and secure 6-digit OTP verification
  - `resumes`: PDF/DOCX multi-format text extraction, spaCy NLP parsing, ATS scoring
  - `jobs`: Job search, creation, and semantic candidate matching
  - `coding`: Problem catalog, test runner, code submission, leaderboard, and AI hints
  - `recruiter`: Deterministic candidate evaluation, weighting configuration, side-by-side comparison
  - `market`: Real-time tech trend ingestion, market snapshot aggregation, and Holt-Winters forecasting
  - `applications`: Candidate job applications and status lifecycles
  - `notifications` & `interviews`: Scheduling and real-time alert notifications

### 3. Intelligence & ML Layer
- **Resume NLP Parser**: spaCy `en_core_web_sm` + PhraseMatcher for entity, education, experience, and skill extraction
- **Skill Normalization**: Fast in-memory canonical synonym mapping + RapidFuzz alias resolution
- **Semantic Matching**: Sentence-Transformers (`all-MiniLM-L6-v2`) generating cosine-similarity match vectors
- **Job Market Forecasting**: Holt-Winters exponential smoothing model for technology demand projection
- **Candidate Ranking**: Deterministic mathematical weighting engine + XGBoost learned ranking model

### 4. Sandbox Execution Layer
- **Isolated Execution Engine**: `DockerExecutor` supporting Docker container isolation (`python:3.10-slim`, `node:18-slim`, `openjdk:17-slim`, `gcc:latest`) with automatic local subprocess fallback
- **Language Support**: Python 3, JavaScript (Node.js), Java 17, C++ (GCC)
- **Result Evaluator**: Preserves 1D ordered array sequences, normalizes 2D combinations, handles multiline matrix outputs, floats, and booleans

### 5. Persistence Layer (Database)
- **Database Engine**: PostgreSQL 15+ (relational schema managed via SQLAlchemy ORM)
- **Data Integrity**: Foreign key constraints, UUID primary keys, and deterministic scoring snapshots
