# AI Hiring Platform - API Reference

Base URL: `http://localhost:8000/api`

Interactive OpenAPI Documentation: `http://localhost:8000/api/docs`

---

## 1. Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new Candidate or Recruiter | Public |
| `POST` | `/api/auth/login` | Login and obtain JWT access & refresh tokens | Public |
| `POST` | `/api/auth/send-otp` | Generate and dispatch secure 6-digit email OTP | Public |
| `POST` | `/api/auth/verify-otp` | Verify email OTP and activate account | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Bearer JWT |
| `POST` | `/api/auth/refresh` | Silent JWT token renewal | Refresh Token |

---

## 2. Resumes & ATS Analysis (`/api/resumes`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/resumes/upload` | Upload PDF/DOCX resume, parse via spaCy NLP, compute ATS score | Candidate |
| `GET` | `/api/resumes/` | List all user resumes | Candidate |
| `GET` | `/api/resumes/{id}` | Get detailed parsed resume, ATS score, and skill gap | Candidate |
| `POST` | `/api/resumes/{id}/match` | Compare resume against specific job requirements | Candidate |

---

## 3. Coding Playground & Execution (`/api/coding`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/coding/problems` | List problems with category, difficulty, and tag filters | Candidate |
| `GET` | `/api/coding/problems/{id}` | Get problem statement, sample tests, and saved code | Candidate |
| `POST` | `/api/coding/run` | Run code against sample test cases in sandbox | Candidate |
| `POST` | `/api/coding/submit` | Submit code against all hidden test cases and record score | Candidate |
| `GET` | `/api/coding/leaderboard` | View global candidate coding rankings and points | Candidate |
| `GET` | `/api/coding/profile` | Get candidate solved count, points, and category breakdown | Candidate |
| `GET` | `/api/coding/assessments` | Get assigned recruiter coding assessments | Candidate |
| `POST` | `/api/coding/assessments/{id}/start` | Start timed coding assessment | Candidate |
| `POST` | `/api/coding/assessments/{id}/submit` | Submit timed coding assessment answers | Candidate |
| `POST` | `/api/coding/hint` | Generate progressive AI hints | Candidate |

---

## 4. Recruiter & Candidate Ranking (`/api/recruiter`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/recruiter/jobs` | Get all recruiter jobs | Recruiter |
| `POST` | `/api/recruiter/jobs` | Post new job opening | Recruiter |
| `PUT` | `/api/recruiter/jobs/{id}` | Update existing job posting | Recruiter |
| `GET` | `/api/recruiter/jobs/{id}/weights` | Get 4-pillar evaluation weights (ATS, Coding, Skill, Interview) | Recruiter |
| `PUT` | `/api/recruiter/jobs/{id}/weights` | Update 4-pillar weights (must sum to exactly 100%) | Recruiter |
| `POST` | `/api/recruiter/jobs/{id}/recalculate` | Trigger deterministic ranking calculation for all applicants | Recruiter |
| `GET` | `/api/recruiter/jobs/{id}/rankings` | Fetch sorted candidate rankings with eligibility split | Recruiter |
| `GET` | `/api/recruiter/jobs/{id}/candidates/{cid}/score-breakdown` | Get itemized mathematical contribution breakdown | Recruiter |
| `POST` | `/api/recruiter/jobs/{id}/compare` | Side-by-side comparison for 2 or more candidates | Recruiter |
| `GET` | `/api/recruiter/jobs/{id}/analytics` | Job analytics and applicant pipeline metrics | Recruiter |

---

## 5. Market Intelligence & Trends (`/api/trends` & `/api/market`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/trends` | High demand skills, emerging roles, and growth forecasts | Public |
| `GET` | `/api/forecast/jobs` | Holt-Winters time-series job volume projection | Public |
| `GET` | `/api/market/overview` | Active snapshot statistics across tech categories | Candidate / Admin |
| `GET` | `/api/market/skills` | Skill popularity and trend momentum | Candidate / Admin |
| `POST` | `/api/market/trigger-collect` | Trigger real-time market data collection cycle | Admin |
