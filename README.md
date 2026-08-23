# 🚀 AI Hiring & Candidate Evaluation Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactjs.org)
[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.12-3776AB.svg?style=flat&logo=python&logoColor=white)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.0+-336791.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4+-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/Pytest-21%20Passed-success.svg?style=flat&logo=pytest)](https://docs.pytest.org)

> An enterprise-grade, full-stack AI recruitment platform featuring automated NLP resume parsing, sandboxed multi-language coding playgrounds, AI mock interviews, and deterministic 4-pillar candidate ranking.

---

## 🔗 Git Repository & Clone Instructions

### Clone the Repository
```bash
git clone https://github.com/Gurukiran-H-S/AI-hiring-platform.git
cd AI-hiring-platform
```

### Git Workflow Commands
```bash
# Check repository status
git status

# Fetch and pull latest changes
git pull origin main

# Create a feature branch
git checkout -b feature/your-feature-name

# Stage and commit your changes
git add .
git commit -m "feat: describe your change"

# Push to GitHub
git push origin feature/your-feature-name
```

---

## 📌 Project Overview

The **AI Hiring & Candidate Evaluation Platform** automates technical hiring workflows through explainable AI models and deterministic scoring algorithms:

- **👨‍💻 Candidate Portal**:
  - **AI Resume Parser**: Extract technical skills, work experience, education, and calculate instant ATS compatibility scores.
  - **Monaco Coding Arena**: Multi-language coding playground (Python, JavaScript, Java, C++) with real-time sandboxed execution and 4-tier progressive AI hints.
  - **Aptitude & Technical Assessments**: Timed interactive tests with automated grading.
  - **AI Mock Interviews**: Audio/visual interview simulations with real-time AI feedback.
  - **Semantic Job Matching**: AI recommendations matching candidate profiles to open roles.
  - **Tech Market Intelligence**: Live analytics on in-demand technologies, salary ranges, and hiring trends.

- **🏢 Recruiter Portal**:
  - **Job Management**: Create, edit, and publish job listings with customizable skill requirements.
  - **Deterministic 4-Pillar Ranking**: Candidate ranking formula combining `ATS Score (20%) + Coding Score (30%) + Skill Match (30%) + Interview Score (20%) = 100%`.
  - **Customizable Weights**: Recruiter drawer allowing custom percentage weights totaling exactly 100%.
  - **Active Pipeline Filtering**: Automatically filters out rejected candidates from active ranking while keeping them accessible under the *Rejected* tab.
  - **Side-by-Side Candidate Comparison**: Compare 2+ candidates across ATS, Coding, Skill alignment, and Interview scores.
  - **Interview Scheduler**: Book and manage online technical interview rounds.

- **⚙️ Administrator Portal**:
  - **System Analytics**: Platform health metrics, user registration volume, and test completion rates.
  - **Database Viewer**: Live PostgreSQL table schemas and record explorer.
  - **User Directory Management**: Search, filter, inspect, and manage candidate and recruiter accounts.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, Tailwind CSS, Monaco Code Editor, Lucide Icons, Chart.js, React Router v6 |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic v2, PostgreSQL, PostgreSQL Drivers (`psycopg2`) |
| **AI & NLP** | spaCy (`en_core_web_sm`), Sentence-Transformers (`all-MiniLM-L6-v2`), Scikit-learn, RapidFuzz |
| **Code Sandbox** | Multi-language Subprocess & Docker Isolation Engine (Python, Node.js/JavaScript, Java, C++) |
| **Auth & Security** | JWT (JSON Web Tokens), bcrypt password hashing, 6-digit OTP verification |

---

## 📂 Complete Project Directory Structure

```
AI-Hiring-Platform/
├── .github/                      # GitHub workflows and CI configurations
├── backend/                      # FastAPI Python Backend Application
│   ├── app/
│   │   ├── ai/                   # AI & NLP Engines
│   │   │   ├── ats_scorer.py     # ATS resume scoring & keyword density analysis
│   │   │   ├── nlp_parser.py     # spaCy resume entity & skill extractor
│   │   │   ├── semantic_match.py # Sentence transformer vector embeddings
│   │   │   └── skill_extractor.py# Skill ontology & taxonomy matcher
│   │   ├── middleware/           # Auth & Security Middleware
│   │   │   └── auth_guard.py     # JWT token decoding & role-based route protection
│   │   ├── models/               # SQLAlchemy ORM Database Schemas
│   │   │   ├── user.py           # User account model (Candidate, Recruiter, Admin)
│   │   │   ├── job.py            # Job vacancy, requirements, and evaluation weights
│   │   │   ├── application.py    # Job application lifecycle & status tracking
│   │   │   ├── resume.py         # Parsed resume metadata, skills, & ATS scores
│   │   │   ├── coding.py         # Coding challenges, submissions, & test cases
│   │   │   ├── interview.py      # Scheduled interviews & feedback notes
│   │   │   └── analytics.py      # Platform metrics & market intelligence records
│   │   ├── routers/              # FastAPI API Endpoints
│   │   │   ├── auth.py           # Login, registration, JWT refresh, OTP verification
│   │   │   ├── candidate.py      # Candidate profile, dashboard, and applications
│   │   │   ├── recruiter.py      # Recruiter rankings, job weights, candidate profile
│   │   │   ├── coding.py         # Coding arena execution, submissions, AI hints
│   │   │   ├── resumes.py        # PDF/DOCX resume upload and NLP parsing
│   │   │   ├── jobs.py           # Job CRUD operations & search
│   │   │   ├── aptitude.py       # Aptitude assessment tests & grading
│   │   │   ├── market.py         # Tech market intelligence & trends
│   │   │   ├── admin.py          # Admin dashboard, DB viewer, user governance
│   │   │   └── notifications.py  # User notifications & alerts
│   │   ├── schemas/              # Pydantic Request & Response Data Models
│   │   ├── services/             # Core Business Logic & Engines
│   │   │   ├── evaluation_engine.py # Deterministic 4-pillar candidate ranking math
│   │   │   ├── coding_executor.py   # Sandboxed multi-language code runner
│   │   │   └── email_service.py     # SMTP verification & notification dispatcher
│   │   ├── utils/                # Password hashing, JWT helpers, & database seeders
│   │   ├── config.py             # App environment configuration (.env loader)
│   │   ├── database.py           # PostgreSQL engine, sessionmaker, & Base model
│   │   └── main.py               # FastAPI application initialization, CORS, routers
│   ├── tests/                    # Automated Test Suite (21/21 Passing)
│   │   ├── api/                  # API smoke & endpoint validation tests
│   │   ├── coding/               # Code sandbox execution & AI hint tests
│   │   ├── integration/          # Recruiter evaluation & application flow tests
│   │   ├── resume/               # NLP parser & ATS extraction tests
│   │   └── scoring/              # 4-pillar deterministic ranking calculation tests
│   ├── requirements.txt          # Python dependencies
│   └── Dockerfile                # Backend containerization file
├── frontend/                     # React 18 + Vite Single Page Application
│   ├── public/
│   │   └── images/               # Platform artwork & illustrations
│   │       ├── hero-talent-collaboration.jpg # Auth collaboration graphic
│   │       └── register-career-scene.jpg     # 3D career scene graphic
│   ├── src/
│   │   ├── components/           # Reusable UI Components
│   │   │   ├── auth/             # PasswordField, OTPInputBoxes
│   │   │   ├── common/           # Navbar, Sidebar, ErrorBoundary, Avatar
│   │   │   └── landing/          # Landing page hero, features, testimonials
│   │   ├── context/              # React Context Providers
│   │   │   └── AuthContext.jsx   # Global user state, JWT tokens, login/logout
│   │   ├── pages/                # Application Page Views
│   │   │   ├── auth/             # Login.jsx, Register.jsx
│   │   │   ├── candidate/        # CandidateDashboard, CodingPlayground, ResumeAnalyzer...
│   │   │   ├── recruiter/        # RecruiterDashboard, CandidateRankings, ManageJobs...
│   │   │   ├── admin/            # AdminDashboard, DatabaseViewer, UserManagement...
│   │   │   └── Landing.jsx       # Public landing page
│   │   ├── services/             # Axios API service client
│   │   ├── App.jsx               # Client-side router & protected routes
│   │   ├── index.css             # Tailwind CSS & custom design tokens
│   │   └── main.jsx              # React DOM root entrypoint
│   ├── package.json              # Frontend Node dependencies & scripts
│   └── vite.config.js            # Vite build configuration & dev proxy
├── docker/                       # Sandbox Dockerfiles (Python, Java, C++)
├── docs/                         # Technical Architecture & API Documentation
├── scripts/                      # Database seeders & maintenance scripts
├── docker-compose.yml            # Multi-container orchestration config
├── .gitignore                    # Git ignore rules
└── README.md                     # Project documentation
```

---

## ⚡ Step-by-Step Setup & How to Run

### 📋 Prerequisites
Ensure you have the following installed on your machine:
- **Python 3.10+** (Python 3.12 recommended): [Download Python](https://www.python.org/downloads/)
- **Node.js 18+ & npm**: [Download Node.js](https://nodejs.org/)
- **PostgreSQL 14+**: [Download PostgreSQL](https://www.postgresql.org/download/)

---

### 1️⃣ Backend Setup & Execution

#### Step 1: Navigate to the backend directory
```bash
cd backend
```

#### Step 2: Create and activate a virtual environment
- **On Windows (PowerShell)**:
  ```powershell
  python -m venv venv
  venv\Scripts\activate
  ```
- **On macOS / Linux**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

#### Step 3: Install dependencies
```bash
pip install -r requirements.txt
```

#### Step 4: Download the spaCy NLP model
```bash
python -m spacy download en_core_web_sm
```

#### Step 5: Configure `.env` file
Create or edit `backend/.env`:
```ini
APP_NAME=AI Hiring Platform
ENVIRONMENT=development
DEBUG=True

# PostgreSQL Database Connection
DATABASE_URL=postgresql://postgres:Admin123@localhost:5432/ai_hiring_db

# Security & JWT
SECRET_KEY=your-super-secret-jwt-key-min-64-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI & NLP Configuration
SENTENCE_TRANSFORMER_MODEL=all-MiniLM-L6-v2
SPACY_MODEL=en_core_web_sm

# Frontend CORS URL
FRONTEND_URL=http://localhost:5173
```

#### Step 6: Start the FastAPI Backend Server
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- **Backend API URL**: `http://localhost:8000`
- **Interactive Swagger Documentation**: `http://localhost:8000/api/docs`
- **Alternative ReDoc Documentation**: `http://localhost:8000/api/redoc`

---

### 2️⃣ Frontend Setup & Execution

#### Step 1: Open a new terminal and navigate to frontend
```bash
cd frontend
```

#### Step 2: Install Node dependencies
```bash
npm install
```

#### Step 3: Start the Vite development server
```bash
npm run dev
```
- **Web Application URL**: `http://localhost:5173`

---

### 3️⃣ Running Automated Tests

#### Run all Backend Pytest Suites:
```bash
cd backend
venv\Scripts\python -m pytest tests -v
```
*(All 21 unit and integration tests will execute and pass).*

#### Validate Frontend Production Build:
```bash
cd frontend
npm run build
```

---

## 🔑 Default Demo Accounts

Use any of the pre-configured accounts below or create a new account on the `/register` page with instant email OTP verification:

| Portal | Email | Password | Role Features |
| :--- | :--- | :--- | :--- |
| **Candidate** | `candidate@example.com` | `Candidate@123` | Resume analysis, coding arena, aptitude tests, mock interview |
| **Recruiter** | `recruiter@example.com` | `Recruiter@123` | Post jobs, candidate rankings, 4-pillar weights, compare |
| **Administrator** | `admin@example.com` | `Admin@123` | Database viewer, system analytics, user directory |

---

## 🌐 Core REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user credentials and return JWT token |
| `POST` | `/api/auth/register` | Register new candidate/recruiter with OTP verification |
| `POST` | `/api/auth/send-otp` | Dispatch 6-digit email verification code |
| `GET` | `/api/recruiter/jobs` | Retrieve all jobs created by recruiter |
| `GET` | `/api/recruiter/jobs/{id}/rankings` | Deterministic 4-pillar ranked candidate list |
| `GET` | `/api/recruiter/jobs/{id}/weights` | Get current evaluation weights (ATS, Coding, Skill, Interview) |
| `PUT` | `/api/recruiter/jobs/{id}/weights` | Update custom evaluation weights (must equal 100%) |
| `GET` | `/api/recruiter/jobs/{id}/analytics` | Job pipeline funnel & score distribution breakdown |
| `POST` | `/api/coding/run` | Execute code in sandboxed runtime environment |
| `POST` | `/api/coding/hint` | Generate progressive 4-tier algorithmic AI coding hints |
| `POST` | `/api/resumes/upload` | Upload resume file, parse entities, and calculate ATS score |
| `GET` | `/api/admin/dashboard` | Platform KPI statistics and health metrics |
| `GET` | `/api/admin/database/tables` | Live database tables, schemas, and record viewer |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. **Fork the Project** (`https://github.com/Gurukiran-H-S/AI-hiring-platform/fork`)
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your Changes** (`git commit -m "feat: add some AmazingFeature"`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

---

## 👨‍💻 Author & Maintainer

- **Developer**: **Gurukiran H S**
- **GitHub**: [@Gurukiran-H-S](https://github.com/Gurukiran-H-S)
- **Repository**: [https://github.com/Gurukiran-H-S/AI-hiring-platform](https://github.com/Gurukiran-H-S/AI-hiring-platform)

---

## 📄 License & Terms

This project is distributed under the **MIT License**.

```text
MIT License

Copyright (c) 2026 Gurukiran H S

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<p align="center">
  <strong>⭐ Star this repository if you find it helpful!</strong><br />
  Built with ❤️ for modern technical recruitment and talent evaluation.
</p>
