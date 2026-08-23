# 🚀 AI Hiring & Candidate Evaluation Platform

> An enterprise-grade, end-to-end platform for automated talent evaluation, NLP-driven ATS resume analysis, multi-language coding playground, and deterministic 4-pillar candidate ranking.

---

## 📌 1. Project Overview

The **AI Hiring & Candidate Evaluation Platform** streamlines technical hiring through data-driven and explainable AI evaluation:

- **👨‍💻 Candidate Portal**: AI Resume Parser with ATS scoring breakdown, multi-language Monaco Coding Playground with 4-level progressive AI hints, Aptitude tests, AI Mock Interviews, semantic Job Matching, and Market Tech Trends.
- **🏢 Recruiter Portal**: Smart Job Posting, deterministic candidate ranking (`ATS (20%) + Coding (30%) + Skill Match (30%) + Interview (20%) = 100%`), candidate status management with automatic rejected candidate filtering, side-by-side candidate comparison, and interview scheduling.
- **⚙️ Administrator Portal**: System health analytics, live PostgreSQL database inspector, user directory management, and market intelligence aggregation.

---

## 🛠️ 2. Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, Tailwind CSS, Monaco Editor, Lucide Icons, Chart.js |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic v2, PostgreSQL |
| **AI / NLP** | spaCy (`en_core_web_sm`), Sentence Transformers (`all-MiniLM-L6-v2`), Scikit-learn, RapidFuzz |
| **Code Execution** | Sandboxed Execution Engine (Python, JavaScript/Node.js, Java, C++) |
| **Security & Auth** | JWT (JSON Web Tokens), bcrypt password hashing, 6-digit OTP verification |

---

## ⚡ 3. How to Run the Project

### 📋 Prerequisites
- **Python 3.10+** (Python 3.12 recommended)
- **Node.js 18+** & **npm**
- **PostgreSQL 14+** (running on `localhost:5432`)

---

### 🔧 Step 1: Backend Setup & Execution

1. **Open a terminal** and navigate to the `backend/` folder:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     venv\Scripts\activate
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Download the spaCy English NLP model**:
   ```bash
   python -m spacy download en_core_web_sm
   ```

5. **Configure Environment Variables (`.env`)**:
   Create or verify `backend/.env`:
   ```ini
   DATABASE_URL=postgresql://postgres:Admin123@localhost:5432/ai_hiring_db
   SECRET_KEY=your-super-secret-jwt-key-min-64-chars
   ENVIRONMENT=development
   DEBUG=True
   FRONTEND_URL=http://localhost:5173
   ```

6. **Start the FastAPI Backend Server**:
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   - **API Server**: `http://localhost:8000`
   - **Interactive API Docs (Swagger UI)**: `http://localhost:8000/api/docs`

---

### 🎨 Step 2: Frontend Setup & Execution

1. **Open a new terminal** and navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite Frontend Development Server**:
   ```bash
   npm run dev
   ```
   - **Web Application**: `http://localhost:5173`

---

### 🧪 Step 3: Run Tests & Verification

- **Run all Backend Unit & Integration Tests**:
  ```bash
  cd backend
  venv\Scripts\python -m pytest tests -v
  ```
- **Verify Frontend Production Build**:
  ```bash
  cd frontend
  npm run build
  ```

---

## 🔑 4. Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Candidate** | `candidate@example.com` | `Candidate@123` |
| **Recruiter** | `recruiter@example.com` | `Recruiter@123` |
| **Administrator** | `admin@example.com` | `Admin@123` |

*(You can also register a new account on the `/register` page with instant email OTP verification).*

---

## 📂 5. Directory Structure

```
AI-Hiring-Platform/
├── backend/
│   ├── app/
│   │   ├── ai/               # NLP resume parser, semantic matcher, ranking engine
│   │   ├── middleware/       # JWT authentication & role-based access guards
│   │   ├── models/           # SQLAlchemy database schemas (User, Job, Application, etc.)
│   │   ├── routers/          # REST endpoints (auth, candidate, recruiter, coding, admin)
│   │   ├── schemas/          # Pydantic validation models
│   │   ├── services/         # Deterministic evaluation engine & code execution
│   │   ├── config.py         # App configuration & settings
│   │   ├── database.py       # DB engine & session lifecycle
│   │   └── main.py           # FastAPI entrypoint with CORS & routers
│   ├── tests/                # Automated pytest suite (21/21 passing)
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/       # Common UI (Navbar, Sidebar, ErrorBoundary, Modals)
│   │   ├── context/          # AuthContext with token refresh & permissions
│   │   ├── pages/
│   │   │   ├── auth/         # Login & Register with OTP and illustrations
│   │   │   ├── candidate/    # Coding playground, resume analysis, job search
│   │   │   ├── recruiter/    # Candidate rankings, job management, interview scheduler
│   │   │   ├── admin/        # System analytics, DB viewer, user management
│   │   │   └── Landing.jsx   # Modern landing page
│   │   └── App.jsx           # Protected client-side routing
│   ├── public/images/        # Platform illustrations & assets
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite configuration & proxy
└── README.md
```

---

## 🌐 6. Core REST API Endpoints

- `POST /api/auth/login` - Authenticate user & issue JWT token
- `POST /api/auth/register` - Create user account with verified email
- `GET  /api/recruiter/jobs/{job_id}/rankings` - Deterministic 4-pillar candidate ranking
- `GET  /api/recruiter/jobs/{job_id}/weights` - Recruiter job evaluation weight distribution
- `GET  /api/recruiter/jobs/{job_id}/analytics` - Pipeline stage distribution & candidate stats
- `POST /api/coding/run` - Execute code snippet in secure sandbox
- `POST /api/coding/hint` - Progressive 4-tier algorithmic AI hints
- `POST /api/resumes/upload` - Upload PDF/DOCX resume & calculate ATS match
- `GET  /api/admin/dashboard` - Administrator platform health & system KPIs

---

## 📄 License
MIT License. Built for enterprise AI hiring and evaluation workflows.
