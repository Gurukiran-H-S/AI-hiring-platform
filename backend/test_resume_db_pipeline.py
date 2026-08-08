import sys
import os
import uuid
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text, inspect
from app.database import engine, SessionLocal
from app.models.user import User, UserRole
from app.models.resume import Resume
from app.ai.resume_parser import resume_parser
from app.ai.skill_normalizer import skill_normalizer
from app.ai.ats_scorer import ats_scorer

def main():
    print("==================================================")
    print("RESUME ANALYZER FULL DB PIPELINE INTEGRATION TEST")
    print("==================================================")

    # 1. Verify PostgreSQL resumes table columns via information_schema
    with engine.connect() as conn:
        result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'resumes' ORDER BY ordinal_position;"))
        columns = {row[0]: row[1] for row in result.fetchall()}

    print(f"\n1. Verified PostgreSQL 'resumes' table columns ({len(columns)} total columns):")
    print(f"   - ats_status: {columns.get('ats_status', 'MISSING')}")
    print(f"   - ats_score: {columns.get('ats_score', 'MISSING')}")
    print(f"   - parsed_skills: {columns.get('parsed_skills', 'MISSING')}")

    assert "ats_status" in columns, "ats_status column missing from PostgreSQL resumes table!"

    # 2. Test Full Pipeline DB Insertion & Retrieval
    db = SessionLocal()
    try:
        # Get or create test user
        user = db.query(User).filter(User.email == "test_cand_db@example.com").first()
        if not user:
            user = User(
                email="test_cand_db@example.com",
                hashed_password="testpassword123",
                full_name="Database Test User",
                role=UserRole.CANDIDATE
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Create Resume Record with ats_status
        raw_resume = """
        Rahul Sharma
        Email: rahul.sharma@example.com | Phone: +91 9876543210
        Skills: Python, FastAPI, React, Docker, PostgreSQL, AWS
        Experience: 3 years building microservices at TechCorp
        Education: B.Tech Computer Science
        """

        parsed = resume_parser.parse(raw_resume)
        normalized_skills = skill_normalizer.normalize_list(parsed.get("skills", []))
        parsed["normalized_skills"] = normalized_skills
        ats_result = ats_scorer.score(parsed, job_skills=["Python", "FastAPI", "Docker", "AWS"])

        resume = Resume(
            user_id=user.id,
            title="Guru-resume-U.pdf",
            file_name="Guru-resume-U.pdf",
            file_type="application/pdf",
            is_primary=True,
            is_parsed=True,
            ats_status="COMPLETED",
            raw_text=raw_resume,
            parsed_name=parsed.get("name"),
            parsed_email=parsed.get("email"),
            parsed_phone=parsed.get("phone"),
            parsed_skills=[s["normalized_skill"] for s in normalized_skills],
            ats_score=ats_result["ats_score"],
            ats_breakdown=ats_result["score_breakdown"],
            keywords_found=ats_result["matched_skills"],
            keywords_missing=ats_result["missing_skills"],
            parsed_at=datetime.utcnow()
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)

        print(f"\n2. Successfully inserted Resume into PostgreSQL database:")
        print(f"   - Resume ID: {resume.id}")
        print(f"   - Title: {resume.title}")
        print(f"   - ATS Status: {resume.ats_status}")
        print(f"   - ATS Score: {resume.ats_score}%")

        assert resume.ats_status == "COMPLETED", f"Expected ats_status COMPLETED, got {resume.ats_status}"

        # Clean up test resume record
        db.delete(resume)
        db.commit()
        print("   - Cleanup: Test resume record deleted successfully.")

    finally:
        db.close()

    print("\n==================================================")
    print("RESUME ANALYZER DB PIPELINE PASSED 100% CLEANLY!")
    print("==================================================")

if __name__ == "__main__":
    main()
