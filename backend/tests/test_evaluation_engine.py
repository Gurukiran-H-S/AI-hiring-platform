"""
Deterministic evaluation-engine tests (recruiter scoring spec §56-59).
Run:  pytest tests/test_evaluation_engine.py
      or venv\\Scripts\\python -m tests.test_evaluation_engine
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services import evaluation_engine as ee


def test_exact_weighted_calculation():
    w = {"ats_weight": 20, "coding_weight": 25, "skill_weight": 30, "interview_weight": 25}
    r = ee.calculate_overall(
        {"ats_score": 70, "coding_score": 65, "skill_match_score": 100, "interview_score": 85}, w
    )
    assert r["contributions"]["ats"]["contribution"] == 14.0
    assert r["contributions"]["coding"]["contribution"] == 16.25
    assert r["contributions"]["skill"]["contribution"] == 30.0
    assert r["contributions"]["interview"]["contribution"] == 21.25
    assert r["overall_score"] == 81.5
    assert r["is_partial"] is False


def test_invalid_weights_rejected():
    with pytest.raises(ee.WeightValidationError) as excinfo:
        ee.validate_weights(ats=0, coding=50, skill=25, interview=20)
    assert "Weights must total exactly 100%" in str(excinfo.value)
    assert excinfo.value.total_weight == 95


def test_equal_weights():
    r = ee.calculate_overall(
        {"ats_score": 80, "coding_score": 60, "skill_match_score": 100, "interview_score": 80},
        {"ats_weight": 25, "coding_weight": 25, "skill_weight": 25, "interview_weight": 25},
    )
    assert r["overall_score"] == 80.0


def test_candidate_deterministic_ranking():
    w59 = {"ats_weight": 20, "coding_weight": 30, "skill_weight": 30, "interview_weight": 20}
    a = ee.calculate_overall(
        {"ats_score": 90, "coding_score": 70, "skill_match_score": 80, "interview_score": 85}, w59
    )
    b = ee.calculate_overall(
        {"ats_score": 80, "coding_score": 90, "skill_match_score": 90, "interview_score": 75}, w59
    )
    assert a["overall_score"] == 80.0
    assert b["overall_score"] == 85.0

    ev_a = {
        "candidate_id": "a",
        "overall_score": a["overall_score"],
        "skill": {"score": 80},
        "coding": {"score": 70},
        "interview": {"score": 85},
        "ats": {"score": 90},
    }
    ev_b = {
        "candidate_id": "b",
        "overall_score": b["overall_score"],
        "skill": {"score": 90},
        "coding": {"score": 90},
        "interview": {"score": 75},
        "ats": {"score": 80},
    }
    ranked = ee.rank_candidates([ev_a, ev_b], {"a": None, "b": None})
    assert ranked[0]["candidate_id"] == "b" and ranked[0]["rank"] == 1
    assert ranked[1]["candidate_id"] == "a" and ranked[1]["rank"] == 2


def test_tie_breaking():
    t1 = {
        "candidate_id": "t1",
        "overall_score": 80.0,
        "skill": {"score": 90},
        "coding": {"score": 60},
        "interview": {"score": 70},
        "ats": {"score": 70},
    }
    t2 = {
        "candidate_id": "t2",
        "overall_score": 80.0,
        "skill": {"score": 95},
        "coding": {"score": 55},
        "interview": {"score": 70},
        "ats": {"score": 70},
    }
    ranked = ee.rank_candidates([t1, t2], {"t1": None, "t2": None})
    assert ranked[0]["candidate_id"] == "t2"


def test_partial_scores_and_edges():
    w = {"ats_weight": 20, "coding_weight": 25, "skill_weight": 30, "interview_weight": 25}
    r = ee.calculate_overall(
        {"ats_score": None, "coding_score": None, "skill_match_score": None, "interview_score": None},
        w,
    )
    assert r["overall_score"] == 0.0 and r["is_partial"]

    r2 = ee.calculate_overall(
        {"ats_score": 70, "coding_score": 65, "skill_match_score": 100, "interview_score": None}, w
    )
    assert r2["overall_score"] == 60.25
    assert r2["is_partial"] is True and r2["used_weight"] == 75.0


def test_match_levels():
    assert ee.get_match_level(91) == "Excellent Match"
    assert ee.get_match_level(85) == "Strong Match"
    assert ee.get_match_level(75) == "Potential Match"
    assert ee.get_match_level(65) == "Moderate Match"
    assert ee.get_match_level(50) == "Low Match"


def test_eligibility():
    assert (
        ee.get_eligibility(
            {"status": "SCORED"}, {"status": "SCORED"}, {"status": "SCORED"}
        )
        == "READY_FOR_RANKING"
    )
    assert (
        ee.get_eligibility(
            {"status": "SCORED"}, {"status": "SCORED"}, {"status": "NOT_ATTEMPTED"}
        )
        == "PENDING_ASSESSMENT"
    )
    assert (
        ee.get_eligibility(
            {"status": "NOT_ATTEMPTED"},
            {"status": "NOT_ATTEMPTED"},
            {"status": "NOT_ATTEMPTED"},
        )
        == "INCOMPLETE"
    )


def test_weight_validation_edges():
    assert ee.validate_weights(20, 25, 30, 25) == 100.0
    with pytest.raises(ee.WeightValidationError):
        ee.validate_weights(-5, 35, 35, 35)
    with pytest.raises(ee.WeightValidationError):
        ee.validate_weights(40, 30, 30, 15)


if __name__ == "__main__":
    pytest.main([__file__])