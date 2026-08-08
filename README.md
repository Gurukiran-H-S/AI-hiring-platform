# Production Deployment & Architecture Documentation
# AI-Hiring and Candidate Evaluation Platform (VTU Major Project)

## 📌 1. Project Overview
This production-ready platform automates candidate screening and evaluation using NLP and Transformers.
It provides distinct dashboards for Candidates, Recruiters, and Administrators.

---

## 🛠️ 2. Technology Stack
- **Frontend**: React.js, Tailwind CSS, Material-UI, Chart.js
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **AI Modules**: spaCy, NLTK, Sentence-Transformers (`all-MiniLM-L6-v2`), Scikit-learn
- **Authentication**: JWT (JSON Web Tokens)
- **Deployment**: Docker & Docker-Compose

---

## 🚀 3. Local Setup & Execution Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL
- Docker & Docker Compose (Optional)

---

### Step 1: Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm
```
Create a `.env` file from `.env.example` and update your PostgreSQL `DATABASE_URL`.

Run the FastAPI backend:
```bash
uvicorn app.main:app --reload --port 8000
```
Interactive API Docs available at: `http://localhost:8000/api/docs`

---

### Step 2: Frontend Setup
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

### Step 3: Deployment via Docker
To run both backend and database simultaneously:
```bash
docker-compose up --build
```
