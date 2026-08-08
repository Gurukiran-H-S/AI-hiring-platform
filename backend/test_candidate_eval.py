import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.services.candidate_scoring_service import candidate_scoring_service

def main():
    print("==================================================")
    print("MULTI-DIMENSIONAL CANDIDATE EVALUATION SUITE")
    print("==================================================")

    # 1. Test Default Weights Calculation
    # ATS: 86%, Coding: 92%, Skill Match: 88%, Interview: 85%
    # Weights: 30% ATS, 40% Coding, 20% Skills, 10% Interview
    weights1 = {"ats_weight": 0.30, "coding_weight": 0.40, "skill_weight": 0.20, "interview_weight": 0.10}
    score1 = candidate_scoring_service.calculate_overall_score(86.0, 92.0, 88.0, 85.0, weights1)
    print(f"\nTest 1 (Default Weights): Overall Score = {score1}%")
    assert score1 == 88.7, f"Expected 88.7, got {score1}"

    # 2. Test Custom Weights Recalculation
    # Weights: 20% ATS, 50% Coding, 20% Skills, 10% Interview
    weights2 = {"ats_weight": 0.20, "coding_weight": 0.50, "skill_weight": 0.20, "interview_weight": 0.10}
    score2 = candidate_scoring_service.calculate_overall_score(86.0, 92.0, 88.0, 85.0, weights2)
    print(f"Test 2 (Custom Weights 50% Coding): Overall Score = {score2}%")
    assert score2 == 89.3, f"Expected 89.3, got {score2}"

    # 3. Test Multi-Candidate Ranking Sorting
    cands = [
        {"name": "Rahul", "ats": 86, "coding": 92, "skills": 88, "int": 85},
        {"name": "Anil", "ats": 91, "coding": 78, "skills": 85, "int": 87},
        {"name": "Priya", "ats": 82, "coding": 89, "skills": 80, "int": 84},
    ]
    for c in cands:
        c["overall"] = candidate_scoring_service.calculate_overall_score(c["ats"], c["coding"], c["skills"], c["int"], weights1)

    cands.sort(key=lambda x: x["overall"], reverse=True)
    print("\nTest 3 (Multi-Candidate Ranking Sorting):")
    for rank, c in enumerate(cands, start=1):
        print(f"Rank #{rank}: {c['name']} - Overall: {c['overall']}%")

    assert cands[0]["name"] == "Rahul", f"Expected Rank 1 Rahul, got {cands[0]['name']}"

    print("\n==================================================")
    print("ALL CANDIDATE EVALUATION TESTS PASSED PERFECTLY!")
    print("==================================================")

if __name__ == "__main__":
    main()
