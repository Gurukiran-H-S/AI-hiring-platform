# AI Hiring Platform - Resume NLP & ATS Scoring Engine

## Overview

The Resume Analysis Engine provides automated extraction of structured candidate profiles from unstructured PDF and Word (`.docx`) documents using Natural Language Processing (spaCy) and calculates comprehensive Applicant Tracking System (ATS) scores.

---

## Processing Pipeline

```
┌─────────────────┐
│ PDF / DOCX File │
└────────┬────────┘
         │ Text Extraction (pdfplumber, PyPDF2, python-docx)
         ▼
┌─────────────────┐
│ Raw Text Stream │
└────────┬────────┘
         │ NLP Section Segmenter & Named Entity Recognizer (spaCy)
         ▼
┌─────────────────┐
│ Extracted Data  │ -> Email, Phone, Location, Skills, Education, Experience, Projects
└────────┬────────┘
         │ Skill Normalization (Synonym Resolution & Categorization)
         ▼
┌─────────────────┐
│ Normalized JSON │
└────────┬────────┘
         │ Weighted Scoring Model (ats_scorer.py)
         ▼
┌─────────────────┐
│  Final ATS Card │ -> Overall ATS Score %, Breakdown, Threshold Warning, Missing Skills
└─────────────────┘
```

---

## 4-Pillar Recruiter Candidate Evaluation

When recruiters rank applicants for a job posting, the deterministic **Evaluation Engine** (`app.services.evaluation_engine`) calculates candidate scores using configurable weights:

$$\text{Overall Score} = \sum (\text{Component Score} \times \text{Component Weight})$$

### Components:
1. **ATS Score (Default: 20%)**: Keyword matching, section completeness, and semantic alignment.
2. **Coding Score (Default: 30%)**: Performance on automated LeetCode-style challenges and sandbox assessments.
3. **Skill Match Score (Default: 30%)**: Jaccard and semantic similarity between applicant skills and job requirements.
4. **Interview Score (Default: 20%)**: Mock or recruiter interview grading.

### Weighting Constraint:
Weights must total exactly **100%**. Invalid weight sets are rejected with `HTTP 400 WeightValidationError`.
