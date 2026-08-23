# AI Hiring & Candidate Evaluation Platform

> Enterprise AI Recruiting, Automated Coding Assessment, and Deterministic 4-Pillar Candidate Ranking Ecosystem.

---

## 📌 Project Overview

The **AI Hiring & Candidate Evaluation Platform** automates technical candidate evaluation and recruitment workflows using Natural Language Processing (NLP), Sentence Transformers, sandboxed multi-language code execution, and deterministic candidate ranking.

### Portals:
- **Candidate Portal**: Resume parsing & ATS breakdown, Monaco Coding Playground, Aptitude Testing, AI Mock Interviews, Job Matching, and Market Intelligence.
- **Recruiter Portal**: Job creation, deterministic 4-pillar candidate ranking, customizable evaluation weights, side-by-side comparison, and interview scheduling.
- **Administrator Portal**: System analytics, live database viewer, user management, and market trend ingestion.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, Tailwind CSS, Monaco Editor, Lucide Icons, Chart.js |
| **Backend** | FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2.0, PostgreSQL |
| **AI / NLP** | spaCy (`en_core_web_sm`), Sentence-Transformers (`all-MiniLM-L6-v2`), NLTK, Scikit-learn, RapidFuzz |
| **Code Execution** | Docker Sandbox Engine (Python, JavaScript/Node.js, Java, C++) with local subprocess fallback |
| **Time-Series / ML** | Holt-Winters Exponential Smoothing, XGBoost Ranking Models |
| **Auth & Security** | JWT (JSON Web Tokens), bcrypt hashing, 6-digit OTP verification |

---

## 📂 Repository Structure

```
AI-Hiring-Platform/
├── backend/
│   ├── app/
│   │   ├── ai/               # spaCy NLP, ATS scorer, semantic matcher, ranker
│   │   ├── middleware/       # JWT Auth middleware & role guards
│   │   ├── models/           # SQLAlchemy database models hub
│   │   ├── routers/          # FastAPI REST endpoints
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Code execution, scoring engine, job providers
│   │   ├── utils/            # JWT helpers, admin seed utilities
│   │   ├── config.py         # Application configuration & env settings
│   │   ├── database.py       # PostgreSQL engine & session factory
│   │   └── main.py           # FastAPI application entrypoint
│   ├── tests/
│   │   ├── api/              # Deep API smoke tests
│   │   ├── coding/           # Multi-language sandbox execution tests
│   │   ├── integration/      # Recruiter flow and legacy migration tests
│   │   ├── resume/           # NLP parser and ATS scoring pipeline tests
│   │   └── scoring/          # Recruiter 4-pillar deterministic ranking math
│   ├── ml/                   # Machine learning models, training, & inference
│   ├── data/                 # Historical jobs dataset & skill taxonomy
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components & landing sections
│   │   ├── context/          # AuthContext & ThemeContext
│   │   ├── pages/            # Candidate, Recruiter, Admin, and Auth pages
│   │   ├── services/         # Centralized API service layer
│   │   ├── App.jsx           # App routing with role-based route protection
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── docker/                   # Java and Python Docker sandbox images
├── docs/                     # Full technical documentation suite
├── scripts/                  # DB migration & scheduled retraining scripts
├── _archive/                 # Safely archived legacy prototypes & demo data
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+ & npm
- PostgreSQL 15+
- (Optional) Docker for containerized code sandboxes

---

### Step 1: Backend Setup
```powershell
cd backend
python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

Configure your `.env` in `backend/`:
```ini
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_hiring_db
SECRET_KEY=your-super-secret-jwt-key
ENVIRONMENT=development
```

Start backend:
```powershell
venv\Scripts\python -m app.main
```
OpenAPI documentation: `http://localhost:8000/api/docs`

---

### Step 2: Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
Frontend development server: `http://localhost:5173`

---

### Step 3: Run Automated Tests
```powershell
cd backend
venv\Scripts\python -m pytest tests -v
```

---

## 📚 Technical Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [REST API Reference](docs/API.md)
- [Database Schema & Models](docs/DATABASE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Code Execution Sandbox](docs/CODING_ENGINE.md)
- [Resume NLP & ATS Engine](docs/ATS.md)
- [Market Intelligence & Forecasting](docs/MARKET_INTELLIGENCE.md)
- [Developer & Testing Guide](docs/DEVELOPMENT.md)
