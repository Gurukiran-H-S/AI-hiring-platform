import os
import sys
import uuid
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.resume import Resume
from app.models.user import User
from app.ai.resume_parser import resume_parser
from app.ai.ats_scorer import ats_scorer
from app.ai.skill_normalizer import skill_normalizer
from app.ai.semantic_matcher import semantic_matcher

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

def get_db():
    db = SessionLocal()
    try:
        return db
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "status": "healthy",
        "framework": "Flask",
        "description": "AI Unified Recruitment Platform - Flask Microservice API"
    })

@app.route("/api/resumes/upload", methods=["POST"])
def upload_resume():
    """Upload and analyze a resume using the Flask backend."""
    db = get_db()
    if not db:
        return jsonify({"detail": "Database connection error"}), 500

    try:
        # Mock auth check (in production, decode JWT token from header)
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"detail": "Unauthorized access - Authorization token missing"}), 401
        
        # Simple fallback mock user for demo purposes
        user = db.query(User).first()
        if not user:
            return jsonify({"detail": "No users found in database to link resume"}), 400

        # Retrieve file from request
        if "file" not in request.files:
            return jsonify({"detail": "No file part in the request"}), 400
        
        file = request.files["file"]
        if file.filename == "":
            return jsonify({"detail": "No selected file"}), 400

        file_content = file.read()
        filename = file.filename

        # Basic text extraction from file
        from app.routers.resumes import _extract_text_from_file
        raw_text = _extract_text_from_file(file_content, filename)
        
        if not raw_text or len(raw_text) < 50:
            return jsonify({"detail": "Could not extract readable text from the resume."}), 400

        # Parse & Score
        parsed = resume_parser.parse(raw_text)
        normalized_skills = skill_normalizer.normalize_list(parsed.get("skills", []))
        parsed["normalized_skills"] = normalized_skills

        ats_result = ats_scorer.score(parsed)
        embedding = semantic_matcher.encode(raw_text[:5000])

        safe_file_name = filename[:250]
        safe_file_type = file.content_type[:250] if file.content_type else "application/octet-stream"
        safe_parsed_name = parsed.get("name", "")[:250] if parsed.get("name") else None
        safe_parsed_email = parsed.get("email", "")[:250] if parsed.get("email") else None

        resume = Resume(
            id=uuid.uuid4(),
            user_id=user.id,
            title=safe_file_name,
            file_name=safe_file_name,
            file_type=safe_file_type,
            is_primary=True,
            is_parsed=True,
            ats_status="COMPLETED",
            raw_text=raw_text[:10000],
            parsed_name=safe_parsed_name,
            parsed_email=safe_parsed_email,
            parsed_phone=parsed.get("phone", "")[:250] if parsed.get("phone") else None,
            parsed_location=parsed.get("location", "")[:250] if parsed.get("location") else None,
            parsed_summary=parsed.get("summary"),
            parsed_skills=[s["normalized_skill"] for s in normalized_skills],
            parsed_education=parsed.get("education", []),
            parsed_experience=parsed.get("experience", []),
            parsed_certifications=parsed.get("certifications", []),
            parsed_projects=parsed.get("projects", []),
            parsed_languages=parsed.get("languages", []),
            ats_score=ats_result["ats_score"],
            ats_breakdown=ats_result["score_breakdown"],
            quality_score=ats_result["score_breakdown"]["keyword_score"],
            improvement_suggestions=ats_result.get("threshold_warning", {}).get("recommended_improvements", []),
            keywords_found=ats_result["matched_skills"],
            keywords_missing=ats_result["missing_skills"],
            embedding_vector=embedding[:128],
            parsed_at=datetime.utcnow()
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)

        return jsonify({
            "message": "Resume uploaded and analyzed successfully using Flask!",
            "resume_id": str(resume.id),
            "ats_score": resume.ats_score,
            "badge": ats_result["level"],
            "improvement_suggestions": resume.improvement_suggestions
        })

    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Resume analysis failed: {str(e)}"}), 500
    finally:
        db.close()

@app.route("/api/nlp/debug/<resume_id>", methods=["GET"])
def nlp_debug_resume(resume_id):
    """Retrieve nlp debug statistics for a resume."""
    db = get_db()
    if not db:
        return jsonify({"detail": "Database connection error"}), 500

    try:
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            return jsonify({"detail": "Resume not found"}), 404

        raw_skills = resume.parsed_skills or []
        normalized = skill_normalizer.normalize_list(raw_skills)

        return jsonify({
            "raw_text": resume.raw_text,
            "sections": {
                "summary": resume.parsed_summary,
                "experience": resume.parsed_experience,
                "education": resume.parsed_education,
                "projects": resume.parsed_projects
            },
            "extracted_skills": raw_skills,
            "normalized_skills": [s["normalized_skill"] for s in normalized],
            "matched_skills": resume.keywords_found or [],
            "missing_skills": resume.keywords_missing or [],
            "experience": resume.parsed_experience or [],
            "education": resume.parsed_education or [],
            "projects": resume.parsed_projects or [],
            "confidence": 0.90
        })
    finally:
        db.close()


@app.route("/api/jobs/<job_id>/analyze", methods=["POST"])
def flask_analyze_job(job_id):
    db = get_db()
    if not db:
        return jsonify({"detail": "Database connection error"}), 500

    try:
        from app.models.job import Job
        from ml.preprocessing.job_parser import job_parser
        from app.models.ml_models import Skill, JobSkill

        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return jsonify({"detail": "Job not found"}), 404

        parsed = job_parser.parse(job.description)
        
        job.min_experience_years = parsed.get("min_experience_years", job.min_experience_years)
        job.required_education = parsed.get("required_education", job.required_education)
        job.required_skills = list(set((job.required_skills or []) + parsed.get("required_skills", [])))
        db.commit()

        db.query(JobSkill).filter(JobSkill.job_id == job.id).delete()
        for sk_name in job.required_skills:
            sk_rec = db.query(Skill).filter(Skill.canonical_name == sk_name).first()
            if not sk_rec:
                sk_rec = Skill(canonical_name=sk_name, source="job_extraction")
                db.add(sk_rec)
                db.commit()
                db.refresh(sk_rec)
            
            js = JobSkill(
                job_id=job.id,
                skill_id=sk_rec.id,
                skill_name=sk_name,
                importance="required",
                is_required=True,
                source="extracted"
            )
            db.add(js)
        db.commit()

        return jsonify({
            "job_title": job.title,
            "required_skills": job.required_skills,
            "preferred_skills": job.preferred_skills or [],
            "experience": job.min_experience_years,
            "education": job.required_education,
            "responsibilities": job.responsibilities or ""
        })
    finally:
        db.close()


@app.route("/api/jobs/recommended", methods=["GET"])
def flask_recommended_jobs():
    db = get_db()
    if not db:
        return jsonify({"detail": "Database connection error"}), 500

    try:
        from app.models.job import Job
        from app.models.job import JobStatus
        from app.models.application import Application
        from app.models.ml_models import ResumeJobMatch

        user = db.query(User).first()  # Mock user
        if not user:
            return jsonify([])

        resume = db.query(Resume).filter(
            Resume.user_id == user.id,
            Resume.is_parsed == True,
        ).order_by(Resume.created_at.desc()).first()

        if not resume:
            return jsonify([])

        jobs = db.query(Job).filter(Job.status == JobStatus.ACTIVE).limit(10).all()
        parsed_resume = {
            "skills": resume.parsed_skills or [],
            "experience": resume.parsed_experience or [],
            "projects": resume.parsed_projects or [],
            "education": resume.parsed_education or [],
            "certifications": resume.parsed_certifications or [],
        }

        results = []
        for j in jobs:
            match_info = ats_scorer.calculate_match_score(
                parsed_resume,
                job_description=j.description,
                required_skills=j.required_skills,
                preferred_skills=j.preferred_skills,
                min_experience_years=j.min_experience_years or 0,
                required_education=j.required_education
            )
            
            ats_info = ats_scorer.score(
                parsed_resume,
                job_description=j.description,
                job_skills=j.required_skills
            )

            match_record = db.query(ResumeJobMatch).filter(
                ResumeJobMatch.resume_id == resume.id,
                ResumeJobMatch.job_id == j.id
            ).first()

            if not match_record:
                match_record = ResumeJobMatch(
                    resume_id=resume.id,
                    candidate_id=user.id,
                    job_id=j.id
                )
                db.add(match_record)

            match_record.ats_score = ats_info["ats_score"]
            match_record.match_score = match_info["match_score"]
            match_record.skill_score = match_info["skill_score"]
            match_record.experience_score = match_info["experience_score"]
            match_record.semantic_score = match_info["semantic_score"]
            match_record.project_score = match_info["project_score"]
            match_record.education_score = match_info["education_score"]
            match_record.matched_skills = match_info["matched_skills"]
            match_record.missing_skills = match_info["missing_skills"]
            db.commit()

            app_status = "None"
            application = db.query(Application).filter(
                Application.candidate_id == user.id,
                Application.job_id == j.id
            ).first()
            if application:
                app_status = application.status.value

            results.append({
                "job_id": str(j.id),
                "title": j.title,
                "company": j.company,
                "location": j.location,
                "fit_score": match_info["match_score"],
                "ats_score": ats_info["ats_score"],
                "matched_skills": match_info["matched_skills"],
                "missing_skills": match_info["missing_skills"],
                "experience_match": match_info["experience_match"],
                "project_match": match_info["project_match"],
                "reason": f"Recommended match at {match_info['match_score']}% fit",
                "application_status": app_status
            })

        results.sort(key=lambda x: x["fit_score"], reverse=True)
        return jsonify(results)
    finally:
        db.close()


@app.route("/api/recruiter/jobs/<job_id>/matched-candidates", methods=["GET"])
def flask_matched_candidates(job_id):
    db = get_db()
    if not db:
        return jsonify({"detail": "Database connection error"}), 500

    try:
        from app.models.job import Job
        from app.models.application import Application
        from app.models.ml_models import ResumeJobMatch

        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return jsonify({"detail": "Job not found"}), 404

        resumes = db.query(Resume).filter(Resume.is_parsed == True).all()
        results = []

        for r in resumes:
            cand_user = db.query(User).filter(User.id == r.user_id).first()
            if not cand_user:
                continue

            parsed_resume = {
                "skills": r.parsed_skills or [],
                "experience": r.parsed_experience or [],
                "projects": r.parsed_projects or [],
                "education": r.parsed_education or [],
                "certifications": r.parsed_certifications or [],
            }

            match_info = ats_scorer.calculate_match_score(
                parsed_resume,
                job_description=job.description,
                required_skills=job.required_skills,
                preferred_skills=job.preferred_skills,
                min_experience_years=job.min_experience_years or 0,
                required_education=job.required_education
            )

            ats_info = ats_scorer.score(
                parsed_resume,
                job_description=job.description,
                job_skills=job.required_skills
            )

            app_status = "None"
            application = db.query(Application).filter(
                Application.candidate_id == cand_user.id,
                Application.job_id == job.id
            ).first()
            if application:
                app_status = application.status.value

            results.append({
                "candidate_id": str(cand_user.id),
                "candidate_name": cand_user.full_name,
                "resume_id": str(r.id),
                "match_score": match_info["match_score"],
                "ats_score": ats_info["ats_score"],
                "matched_skills": match_info["matched_skills"],
                "missing_skills": match_info["missing_skills"],
                "partial_skills": match_info["matched_preferred"],
                "experience": match_info["experience_match"],
                "education": match_info["education_match"],
                "application_status": app_status
            })

        results.sort(key=lambda x: x["match_score"], reverse=True)
        return jsonify(results)
    finally:
        db.close()


@app.route("/api/candidates/<candidate_id>/profile", methods=["GET"])
def flask_candidate_profile(candidate_id):
    db = get_db()
    if not db:
        return jsonify({"detail": "Database connection error"}), 500

    try:
        resume = db.query(Resume).filter(
            Resume.user_id == candidate_id,
            Resume.is_parsed == True
        ).order_by(Resume.is_primary.desc(), Resume.created_at.desc()).first()

        if not resume:
            return jsonify({"detail": "No parsed resume found"}), 404

        return jsonify({
            "skills": resume.parsed_skills or [],
            "experience": resume.parsed_experience or [],
            "education": resume.parsed_education or [],
            "projects": resume.parsed_projects or [],
            "certifications": resume.parsed_certifications or []
        })
    finally:
        db.close()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
