import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.ai.resume_parser import resume_parser
from app.ai.skill_normalizer import skill_normalizer
from app.ai.ats_scorer import ats_scorer

def main():
    print("==================================================")
    print("RESUME NLP + ATS DIAGNOSTIC TEST SUITE")
    print("==================================================")

    # 1. Test Text Clean & Section Parser
    sample_text = """
    Rahul Sharma
    Email: rahul.sharma@example.com | Phone: +91 9876543210 | Location: Bangalore, India
    
    SUMMARY
    Enthusiastic Software Engineer with 4 years of experience building scalable backend services.

    SKILLS
    Programming: Python, Java, JavaScript, C++
    Frameworks: React.js, FastAPI, Django, Node.js
    Databases & Cloud: PostgreSQL, MongoDB, Docker, AWS, Git

    EXPERIENCE
    Senior Software Engineer - TechCorp (2022 - Present)
    - Developed microservices with Python, FastAPI, and Docker.
    - Managed PostgreSQL databases and deployed containers on AWS.

    EDUCATION
    B.Tech in Computer Science, IIT Bombay (2018 - 2022)
    """

    print("\n1. Testing spaCy & Regex Resume Parser...")
    parsed = resume_parser.parse(sample_text)
    print(f"   Email: {parsed.get('email')}")
    print(f"   Phone: {parsed.get('phone')}")
    print(f"   Raw Extracted Skills: {parsed.get('skills')}")
    assert parsed.get("email") == "rahul.sharma@example.com", "Email extraction failed"

    # 2. Test Skill Normalization
    print("\n2. Testing Skill Normalization...")
    normalized = skill_normalizer.normalize_list(parsed.get("skills", []))
    norm_names = [s["normalized_skill"] for s in normalized]
    print(f"   Normalized Skills: {norm_names}")
    assert "Python" in norm_names, "Skill normalization missing Python"
    assert "FastAPI" in norm_names, "FastAPI normalization check"

    # 3. Test ATS Scorer
    print("\n3. Testing Explainable ATS Scorer & Threshold Warning...")
    ats = ats_scorer.score(parsed, job_skills=["Python", "FastAPI", "Docker", "AWS", "Kubernetes"])
    print(f"   ATS Score: {ats['ats_score']}%")
    print(f"   Match Level: {ats['level']}")
    print(f"   Matched Skills: {ats['matched_skills']}")
    print(f"   Missing Skills: {ats['missing_skills']}")

    assert "Kubernetes" in ats["missing_skills"], "Expected Kubernetes in missing skills"
    assert ats["threshold_warning"] is not None, "Expected Low ATS threshold warning for score < 60%"
    assert ats["threshold_warning"]["active"] is True, "Threshold warning active"

    print("\n==================================================")
    print("ALL RESUME NLP & ATS TESTS PASSED PERFECTLY!")
    print("==================================================")

if __name__ == "__main__":
    main()
