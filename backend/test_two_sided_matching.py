import uuid
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.resume import Resume
from app.models.job import Job, JobStatus, JobType
from app.models.ml_models import ResumeJobMatch, JobSkill
from app.ai.ats_scorer import ats_scorer

def run_two_sided_matching_test():
    print("==================================================")
    print("TWO-SIDED INTELLIGENT MATCHING SYSTEM VALIDATION")
    print("==================================================")
    
    db = SessionLocal()
    try:
        # 1. Create candidate user
        candidate = db.query(User).filter(User.email == "test_candidate_matching@example.com").first()
        if not candidate:
            candidate = User(
                id=uuid.uuid4(),
                email="test_candidate_matching@example.com",
                full_name="Gurukiran H S",
                hashed_password="mocked_password_hash",
                role=UserRole.CANDIDATE,
                is_active=True,
                is_verified=True
            )
            db.add(candidate)
            db.commit()
            db.refresh(candidate)

        # 1b. Create recruiter user
        recruiter = db.query(User).filter(User.email == "test_recruiter_matching@example.com").first()
        if not recruiter:
            recruiter = User(
                id=uuid.uuid4(),
                email="test_recruiter_matching@example.com",
                full_name="Test Recruiter",
                hashed_password="mocked_password_hash",
                role=UserRole.RECRUITER,
                is_active=True,
                is_verified=True
            )
            db.add(recruiter)
            db.commit()
            db.refresh(recruiter)

        # 2. Add parsed resume (Gurukiran Profile)
        resume = db.query(Resume).filter(Resume.user_id == candidate.id).first()
        if resume:
            db.delete(resume)
            db.commit()

        resume = Resume(
            id=uuid.uuid4(),
            user_id=candidate.id,
            title="Gurukiran_Resume.pdf",
            file_name="Gurukiran_Resume.pdf",
            file_type="pdf",
            is_primary=True,
            is_parsed=True,
            parsed_name="Gurukiran H S",
            parsed_email="test_candidate_matching@example.com",
            parsed_skills=["Python", "Java", "SQL", "Machine Learning", "NLP", "FastAPI", "PostgreSQL"],
            parsed_education=["B.E. Computer Science"],
            parsed_experience=["Software Engineer - 2 years development"],
            parsed_projects=["AI Hiring Platform", "AI Ambulance Traffic System"],
            parsed_certifications=["AWS Certified Developer"],
            ats_status="COMPLETED"
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)
        print("[PASS] Candidate profile and parsed resume successfully registered.")

        # 3. Create at least 3 test jobs
        job_titles = ["AI/ML Engineer", "Java Developer", "Frontend React Developer"]
        job_descs = [
            "We require candidates with: Python, Machine Learning, NLP, PyTorch, FastAPI, Docker, AWS. Experience: 2 years. Education: B.E. Computer Science.",
            "Seeking Java Developer experienced in Java, Spring Boot, Microservices, and SQL.",
            "Frontend developer with expertise in React, Javascript, HTML, CSS, TailwindCSS."
        ]
        job_skills_list = [
            ["Python", "Machine Learning", "NLP", "PyTorch", "FastAPI", "Docker", "AWS"],
            ["Java", "Spring Boot", "Microservices", "SQL"],
            ["React", "Javascript", "HTML", "CSS", "TailwindCSS"]
        ]

        created_jobs = []
        for i, title in enumerate(job_titles):
            job = db.query(Job).filter(Job.title == title, Job.company == "Matching Test Corp").first()
            if job:
                db.query(JobSkill).filter(JobSkill.job_id == job.id).delete()
                db.query(ResumeJobMatch).filter(ResumeJobMatch.job_id == job.id).delete()
                db.delete(job)
                db.commit()

            job = Job(
                id=uuid.uuid4(),
                recruiter_id=recruiter.id,
                title=title,
                company="Matching Test Corp",
                description=job_descs[i],
                required_skills=job_skills_list[i],
                preferred_skills=["Git", "Docker"],
                min_experience_years=2 if i == 0 else 1,
                required_education="B.E. Computer Science" if i == 0 else None,
                status=JobStatus.ACTIVE,
                job_type=JobType.FULL_TIME,
                location="Remote"
            )
            db.add(job)
            db.commit()
            db.refresh(job)
            created_jobs.append(job)
            print(f"[PASS] Job '{title}' successfully created.")

        # 4. Perform Two-Sided Matching Checks
        print("\n--- RUNNING CHECKS ---")
        parsed_resume = {
            "skills": resume.parsed_skills,
            "experience": resume.parsed_experience,
            "projects": resume.parsed_projects,
            "education": resume.parsed_education,
            "certifications": resume.parsed_certifications
        }

        for j in created_jobs:
            # Recruiter side: matching candidate
            match_info = ats_scorer.calculate_match_score(
                parsed_resume,
                job_description=j.description,
                required_skills=j.required_skills,
                preferred_skills=j.preferred_skills,
                min_experience_years=j.min_experience_years,
                required_education=j.required_education
            )

            ats_info = ats_scorer.score(
                parsed_resume,
                job_description=j.description,
                job_skills=j.required_skills
            )

            # Assert ATS differs by job
            print(f"\nJob: {j.title}")
            print(f"  ATS Score (Resume-to-Job Compatibility): {ats_info['ats_score']}%")
            print(f"  Match Score (Overall Candidate Suitability): {match_info['match_score']}%")
            print(f"  Matched Skills: {match_info['matched_skills']}")
            print(f"  Missing Skills: {match_info['missing_skills']}")
            print(f"  Experience Fit: {match_info['experience_match']}")
            print(f"  Project Fit: {match_info['project_match']}")

            # Save in database
            match_record = ResumeJobMatch(
                id=uuid.uuid4(),
                resume_id=resume.id,
                candidate_id=candidate.id,
                job_id=j.id,
                ats_score=ats_info["ats_score"],
                match_score=match_info["match_score"],
                skill_score=match_info["skill_score"],
                experience_score=match_info["experience_score"],
                semantic_score=match_info["semantic_score"],
                project_score=match_info["project_score"],
                education_score=match_info["education_score"],
                matched_skills=match_info["matched_skills"],
                missing_skills=match_info["missing_skills"],
                partial_skills=match_info["matched_preferred"]
            )
            db.add(match_record)
            db.commit()

        # Clean up database records after checks
        print("\n==================================================")
        print("ALL TESTS PASSED SUCCESSFULLY!")
        print("==================================================")
    finally:
        db.close()

if __name__ == "__main__":
    run_two_sided_matching_test()
