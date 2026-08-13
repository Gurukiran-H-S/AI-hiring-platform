import sys
import os
import uuid
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text, inspect
from app.database import engine, SessionLocal
from app.models.user import User, UserRole
from app.models.resume import Resume

def main():
    print("==================================================")
    print("LONG DOCX MIME TYPE & RESUME INSERTION TEST")
    print("==================================================")

    db = SessionLocal()
    try:
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

        long_mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        print(f"Testing insertion with file_type MIME length = {len(long_mime)} chars: '{long_mime}'")

        resume = Resume(
            user_id=user.id,
            title="ATS_Optimized_Reference_Resume_AI_ML.docx",
            file_name="ATS_Optimized_Reference_Resume_AI_ML.docx",
            file_type=long_mime[:250],
            is_primary=True,
            is_parsed=True,
            ats_status="COMPLETED",
            raw_text="Sample AI ML Engineer Resume text",
            parsed_name="AI ML Developer",
            parsed_email="aiml@example.com",
            parsed_skills=["Python", "PyTorch", "FastAPI", "Docker"],
            ats_score=88.5,
            parsed_at=datetime.utcnow()
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)

        print(f"\n[SUCCESS] Inserted Resume into database with long DOCX MIME type!")
        print(f"   - Resume ID: {resume.id}")
        print(f"   - File Type: {resume.file_type}")
        print(f"   - ATS Status: {resume.ats_status}")

        db.delete(resume)
        db.commit()
        print("   - Cleanup: Test resume record deleted successfully.")

    finally:
        db.close()

    print("\n==================================================")
    print("DOCX LONG MIME INSERTION PASSED 100% CLEANLY!")
    print("==================================================")

if __name__ == "__main__":
    main()
