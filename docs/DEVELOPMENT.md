# AI Hiring Platform - Developer Guide

## Local Development Workflow

### 1. Running Backend Locally
```powershell
cd backend
venv\Scripts\python -m app.main
```
Server starts on: `http://localhost:8000` (OpenAPI Swagger at `http://localhost:8000/api/docs`).

---

### 2. Running Frontend Locally
```powershell
cd frontend
npm run dev
```
Vite dev server starts on: `http://localhost:5173`.

---

### 3. Running Automated Tests
Run the organized test suite using `pytest`:
```powershell
cd backend
venv\Scripts\python -m pytest tests -v
```

Run specific test modules:
```powershell
# Recruiter scoring math tests
venv\Scripts\python -m pytest tests/scoring/test_evaluation_engine.py

# Multi-language code execution sandbox tests
venv\Scripts\python -m pytest tests/coding/test_docker_executor.py

# Resume parser & ATS tests
venv\Scripts\python -m pytest tests/resume/test_resume_parser.py

# End-to-end API smoke tests
venv\Scripts\python -m pytest tests/api/test_smoke_deep.py
```

---

### 4. Database Migrations & Seeding
To sync the database schema:
```powershell
python scripts/migrate_db.py
```

To seed coding problems:
```powershell
python -c "from app.database import SessionLocal; from app.services.dataset_importer import seed_default_problems; db = SessionLocal(); seed_default_problems(db); db.close()"
```
