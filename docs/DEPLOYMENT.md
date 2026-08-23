# AI Hiring Platform - Deployment Guide

## Production & Local Deployment

### 1. Docker Compose Deployment (Recommended)

The platform includes multi-container Docker deployment orchestrated via `docker-compose.yml`:

```bash
docker-compose up -d --build
```

**Services Included:**
- `backend`: FastAPI Python application with Uvicorn worker pool
- `db`: PostgreSQL 15 database container with persistent volume

---

### 2. Manual Local Setup

#### Prerequisites:
- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+ & npm
- PostgreSQL 15+ running on port 5432
- (Optional) Docker for containerized code sandboxing

#### Backend Setup:
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python -m app.main
```

#### Frontend Setup:
```powershell
cd frontend
npm install
npm run dev
```

#### Production Frontend Bundle:
```powershell
cd frontend
npm run build
```

---

## Environment Variables (`.env`)

Configure your `backend/.env` file:
```ini
# Application
APP_NAME=AI Hiring & Evaluation Platform
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=generate-a-secure-random-64-character-jwt-key

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_hiring_db

# Email / SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@ai-hiring.com

# Sandbox Security
CODE_EXECUTION_TIME_LIMIT=2.0
CODE_EXECUTION_MEMORY_MB=256
```
