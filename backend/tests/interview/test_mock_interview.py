"""
Tests for AI Mock Interview Module:
- Speech recognition transcript analysis
- Expected answer point detection (1 / Mentioned vs 0 / Not Mentioned)
- Anti-false-positive and anti-false-negative rules
- Empty speech handling & scoring formulas
- End-to-end interview flow & evaluation engine integration
"""

import pytest
from app.ai.interview_analyzer import analyze_transcript, synthesize_interview_report
from app.services.interview_service import generate_interview_questions


def test_speech_recognized_and_point_matched():
    """Test that candidate answering expected points receives 1 / Mentioned and proper coverage score."""
    expected_points = [
        {"id": 1, "point": "Python-based framework", "weight": 1.0},
        {"id": 2, "point": "REST API support", "weight": 1.0},
        {"id": 3, "point": "Type validation with Pydantic", "weight": 1.0},
        {"id": 4, "point": "Automatic OpenAPI Swagger documentation", "weight": 1.0},
        {"id": 5, "point": "Async support and event loop", "weight": 1.0},
    ]

    transcript = (
        "FastAPI is a modern Python framework designed to build REST APIs. "
        "It provides automatic type validation using Pydantic schemas and generates "
        "interactive Swagger documentation out of the box with native async await support."
    )

    result = analyze_transcript(
        transcript=transcript,
        question_text="Explain how FastAPI is useful for building REST APIs.",
        expected_points=expected_points,
        duration_seconds=30
    )

    assert result["response_status"] == "COMPLETED"
    assert result["coverage_score"] == 100.0
    assert result["answer_score"] >= 85.0
    assert len(result["point_results"]) == 5

    # Verify all points are marked as 1 / Mentioned
    for p in result["point_results"]:
        assert p["matched"] is True
        assert p["evidence_text"] is not None


def test_semantic_equivalence_matching():
    """Test anti-false-negative rule: semantic equivalents like Docker matching Containerization."""
    expected_points = [
        {"id": 1, "point": "Containerization and environment isolation", "weight": 1.0},
        {"id": 2, "point": "Packaging code and dependencies into Dockerfile images", "weight": 1.0},
    ]

    transcript = "I used Docker to package the application with all its dependencies into an isolated container image."

    result = analyze_transcript(
        transcript=transcript,
        question_text="Why use containerization?",
        expected_points=expected_points,
        duration_seconds=15
    )

    assert result["coverage_score"] == 100.0
    for p in result["point_results"]:
        assert p["matched"] is True


def test_anti_false_positive_insufficient_phrase():
    """Test anti-false-positive rule: simple common words should NOT match multi-word concepts accidentally."""
    expected_points = [
        {"id": 1, "point": "Database indexing on queried columns", "weight": 1.0},
        {"id": 2, "point": "EXPLAIN ANALYZE execution plan profiling", "weight": 1.0},
    ]

    # Candidate merely says "I used a database" - does NOT mention indexing or profiling
    transcript = "I connected to a PostgreSQL database."

    result = analyze_transcript(
        transcript=transcript,
        question_text="How would you optimize a slow database query?",
        expected_points=expected_points,
        duration_seconds=10
    )

    # Both points should be 0 / Not Mentioned
    assert result["point_results"][0]["matched"] is False
    assert result["point_results"][1]["matched"] is False
    assert result["coverage_score"] == 0.0


def test_empty_speech_silence_handling():
    """Test that empty speech or silence yields 0 score and NO_SPEECH status."""
    expected_points = [
        {"id": 1, "point": "REST API support", "weight": 1.0},
    ]

    result = analyze_transcript(
        transcript="   ",
        question_text="Explain REST APIs.",
        expected_points=expected_points,
        duration_seconds=5
    )

    assert result["response_status"] == "NO_SPEECH"
    assert result["coverage_score"] == 0.0
    assert result["answer_score"] == 0.0
    assert result["point_results"][0]["matched"] is False


def test_filler_words_detection():
    """Test filler word detection and communication analysis."""
    expected_points = [
        {"id": 1, "point": "Python-based framework", "weight": 1.0},
    ]

    transcript = "Um, like, FastAPI is, you know, actually a Python framework, right?"

    result = analyze_transcript(
        transcript=transcript,
        question_text="What is FastAPI?",
        expected_points=expected_points,
        duration_seconds=12
    )

    assert result["filler_words_count"] >= 4
    assert result["communication"]["filler_words"] >= 4
    # But point was still mentioned
    assert result["point_results"][0]["matched"] is True


def test_question_score_formula():
    """Test 70% coverage + 30% semantic relevance formula."""
    expected_points = [
        {"id": 1, "point": "Point A", "weight": 1.0},
        {"id": 2, "point": "Point B", "weight": 1.0},
        {"id": 3, "point": "Point C", "weight": 1.0},
        {"id": 4, "point": "Point D", "weight": 1.0},
        {"id": 5, "point": "Point E", "weight": 1.0},
    ]

    # Partial transcript covering 3 of 5
    transcript = "Point A is implemented. Point B is configured. Point C is verified."

    result = analyze_transcript(
        transcript=transcript,
        question_text="Discuss Points A, B, C, D, and E.",
        expected_points=expected_points,
        duration_seconds=20
    )

    assert result["coverage_score"] == 60.0  # 3 / 5 * 100
    # Score should combine 70% of 60 (=42) + 30% of semantic
    assert result["answer_score"] >= 42.0


def test_question_generation_curation():
    """Test question generation for Python Developer."""
    questions = generate_interview_questions(
        role_title="Python Developer",
        interview_type="Technical",
        num_questions=5
    )

    assert len(questions) == 5
    for idx, q in enumerate(questions):
        assert q["question_number"] == idx + 1
        assert "question_text" in q
        assert len(q["expected_points"]) >= 4
