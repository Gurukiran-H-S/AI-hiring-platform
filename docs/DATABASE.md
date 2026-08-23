# AI Hiring Platform - Database Documentation

## Relational Schema & ORM Architecture

The database is built on **PostgreSQL** using **SQLAlchemy** declarative models with UUID primary keys.

---

## Core Tables & Models

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      users      │──────<│     resumes     │       │      jobs       │
│  (Auth & Role)  │       │ (Parsed & ATS)  │       │ (Postings)      │
└────────┬────────┘       └─────────────────┘       └────────┬────────┘
         │                                                   │
         │                ┌─────────────────┐                │
         └───────────────<│  applications   │>───────────────┘
                          │ (Candidate/Job) │
                          └────────┬────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │ candidate_evaluation_snapshots│
                   │ (4-Pillar Deterministic Score)│
                   └───────────────────────────────┘
```

### 1. `users`
- Authentication, role (`CANDIDATE`, `RECRUITER`, `ADMIN`), hashed password, OTP verification timestamps, and active status.
- Relationships: `candidate_profile`, `recruiter_profile`, `resumes`, `applications`, `interviews`.

### 2. `resumes`
- Multi-format file metadata (`PDF`, `DOCX`), extracted `raw_text`, parsed JSON components (`parsed_skills`, `parsed_experience`, `parsed_education`, `parsed_projects`), ATS score, keyword matches, and missing skill suggestions.

### 3. `jobs`
- Recruiter job postings, title, department, location, required and preferred skills, experience range, salary, and active status (`ACTIVE`, `CLOSED`, `DRAFT`).

### 4. `job_weights`
- Configurable evaluation weights per job:
  - `ats_weight` (Default: 20%)
  - `coding_weight` (Default: 30%)
  - `skill_weight` (Default: 30%)
  - `interview_weight` (Default: 20%)
  - Constraint: `ats + coding + skill + interview == 100%`.

### 5. `candidate_evaluation_snapshots`
- Deterministic scoring record for each application:
  - `ats_score` & weighted contribution
  - `coding_score` & weighted contribution
  - `skill_match_score` & weighted contribution
  - `interview_score` & weighted contribution
  - `overall_score`: Final percentage (0 - 100)
  - `rank`: Rank index among all applicants for the job
  - `eligibility`: `READY_FOR_RANKING` | `PENDING_ASSESSMENT` | `INCOMPLETE`

### 6. `coding_problems` & `problem_test_cases`
- 320+ coding problems across Arrays, Strings, Linked Lists, Trees, Dynamic Programming, Graphs, SQL.
- Test cases with `input_data`, `expected_output`, and `is_hidden` privacy flags.

### 7. `candidate_submissions` & `candidate_coding_stats`
- Tracks candidate attempts, verdict (`Accepted`, `Wrong Answer`, `Runtime Error`, `Time Limit Exceeded`), language, runtime, points earned, and global accuracy.

### 8. `market_snapshots` & `historical_job_postings`
- Tech trend time-series records, keyword demand counts, and monthly posting totals used for Holt-Winters forecasting models.

---

## Schema Migration & Inspection

Run the schema verification and migration tool:
```powershell
python scripts/migrate_db.py
```
