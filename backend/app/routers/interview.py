"""
FastAPI Router for AI Mock Interview Module:
- Real-time speech recognition transcript analysis
- Expected answer point detection (1 / Mentioned vs 0 / Not Mentioned)
- Scoring, PostgreSQL persistence, and Recruiter evaluation integration
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.application import Application
from app.models.resume import Resume
from app.models.interview import (
    MockInterview, MockInterviewQuestion, MockInterviewResponse,
    Interview, InterviewStatus, InterviewType
)
from app.models.evaluation import CandidateScore
from app.middleware.auth_middleware import get_current_user
from app.schemas.interview import (
    MockInterviewStartRequest, QuestionAnalyzeRequest,
    QuestionResponseSubmitRequest, MockInterviewStateSchema,
    AnalysisResponseSchema, InterviewReportSchema
)
from app.ai.interview_analyzer import analyze_transcript, synthesize_interview_report
from app.services.interview_service import generate_interview_questions

router = APIRouter(prefix="/api/interview", tags=["AI Mock Interview"])


@router.post("/start", response_model=MockInterviewStateSchema)
async def start_mock_interview(
    req: MockInterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Start a new AI Mock Interview tailored to a chosen job or technical role.
    """
    role_title = req.role_title or "Software Engineer"
    job_desc = ""
    candidate_skills = []

    # 1. If job_id provided, fetch job context
    if req.job_id:
        job = db.query(Job).filter(Job.id == req.job_id).first()
        if job:
            role_title = job.title
            job_desc = job.description or ""

    # 2. Extract candidate skills from latest parsed resume
    resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .first()
    )
    if resume and resume.parsed_skills:
        candidate_skills = resume.parsed_skills if isinstance(resume.parsed_skills, list) else []

    # 3. Generate tailored questions
    questions_data = generate_interview_questions(
        role_title=role_title,
        interview_type=req.interview_type or "Technical",
        job_description=job_desc,
        candidate_skills=candidate_skills,
        num_questions=req.num_questions or 5
    )

    # 4. Create MockInterview record
    mock_interview = MockInterview(
        candidate_id=current_user.id,
        job_id=req.job_id,
        role_title=role_title,
        interview_type=req.interview_type or "Technical",
        status="in_progress",
        total_questions=len(questions_data),
        completed_questions=0,
        started_at=datetime.utcnow()
    )
    db.add(mock_interview)
    db.flush()

    # 5. Create Question records with structured expected points
    for q_item in questions_data:
        question_row = MockInterviewQuestion(
            interview_id=mock_interview.id,
            question_number=q_item["question_number"],
            question_text=q_item["question_text"],
            question_type=q_item["question_type"],
            category=q_item["category"],
            difficulty=q_item["difficulty"],
            expected_points=q_item["expected_points"]
        )
        db.add(question_row)

    db.commit()
    db.refresh(mock_interview)

    # Reload with relationships
    return (
        db.query(MockInterview)
        .options(
            joinedload(MockInterview.questions),
            joinedload(MockInterview.responses)
        )
        .filter(MockInterview.id == mock_interview.id)
        .first()
    )


@router.get("/{interview_id}", response_model=MockInterviewStateSchema)
async def get_mock_interview(
    interview_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get mock interview progress, questions, and submitted responses.
    """
    interview = (
        db.query(MockInterview)
        .options(
            joinedload(MockInterview.questions),
            joinedload(MockInterview.responses)
        )
        .filter(MockInterview.id == interview_id)
        .first()
    )

    if not interview:
        raise HTTPException(status_code=404, detail="Mock interview session not found.")

    # Authorization guard: Candidate who owns it or Recruiter/Admin
    if current_user.role == UserRole.CANDIDATE and interview.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to interview transcript.")

    return interview


@router.post("/{interview_id}/analyze", response_model=AnalysisResponseSchema)
async def analyze_question_transcript(
    interview_id: UUID,
    req: QuestionAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Live NLP evaluation of candidate transcript against question expected points.
    Returns: point_results (1 / Mentioned vs 0 / Not Mentioned), coverage %, question score.
    """
    question = (
        db.query(MockInterviewQuestion)
        .filter(
            MockInterviewQuestion.id == req.question_id,
            MockInterviewQuestion.interview_id == interview_id
        )
        .first()
    )

    if not question:
        raise HTTPException(status_code=404, detail="Interview question not found.")

    analysis = analyze_transcript(
        transcript=req.transcript,
        question_text=question.question_text,
        expected_points=question.expected_points or [],
        duration_seconds=req.duration_seconds or 0
    )

    return analysis


@router.post("/{interview_id}/response")
async def submit_question_response(
    interview_id: UUID,
    req: QuestionResponseSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Save candidate's spoken response and NLP evaluation for a single question.
    """
    interview = db.query(MockInterview).filter(MockInterview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    if interview.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    question = (
        db.query(MockInterviewQuestion)
        .filter(
            MockInterviewQuestion.id == req.question_id,
            MockInterviewQuestion.interview_id == interview_id
        )
        .first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="Interview question not found.")

    # 1. Analyze transcript
    analysis = analyze_transcript(
        transcript=req.transcript,
        question_text=question.question_text,
        expected_points=question.expected_points or [],
        duration_seconds=req.duration_seconds or 0
    )

    # 2. Check if response already exists (upsert)
    existing_resp = (
        db.query(MockInterviewResponse)
        .filter(
            MockInterviewResponse.interview_id == interview_id,
            MockInterviewResponse.question_id == req.question_id
        )
        .first()
    )

    if existing_resp:
        existing_resp.transcript = req.transcript
        existing_resp.duration_seconds = req.duration_seconds or 0
        existing_resp.answer_score = analysis["answer_score"]
        existing_resp.coverage_score = analysis["coverage_score"]
        existing_resp.semantic_score = analysis["semantic_score"]
        existing_resp.filler_words_count = analysis["filler_words_count"]
        existing_resp.point_results = analysis["point_results"]
        existing_resp.response_status = analysis["response_status"]
    else:
        new_resp = MockInterviewResponse(
            interview_id=interview_id,
            question_id=req.question_id,
            candidate_id=current_user.id,
            transcript=req.transcript,
            duration_seconds=req.duration_seconds or 0,
            answer_score=analysis["answer_score"],
            coverage_score=analysis["coverage_score"],
            semantic_score=analysis["semantic_score"],
            filler_words_count=analysis["filler_words_count"],
            point_results=analysis["point_results"],
            response_status=analysis["response_status"],
            created_at=datetime.utcnow()
        )
        db.add(new_resp)

    # Update completed questions count
    resp_count = (
        db.query(MockInterviewResponse)
        .filter(MockInterviewResponse.interview_id == interview_id)
        .count()
    )
    interview.completed_questions = max(interview.completed_questions, resp_count)
    db.commit()

    return {
        "status": "saved",
        "question_id": str(req.question_id),
        "analysis": analysis
    }


@router.post("/{interview_id}/complete")
async def complete_mock_interview(
    interview_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Finalize interview, calculate final scores & strengths/gaps, and persist to database.
    Integrates seamlessly with recruiter ranking engine.
    """
    interview = (
        db.query(MockInterview)
        .options(
            joinedload(MockInterview.questions),
            joinedload(MockInterview.responses)
        )
        .filter(MockInterview.id == interview_id)
        .first()
    )

    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    if interview.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    # 1. Synthesize final interview report
    responses_data = [
        {
            "transcript": r.transcript or "",
            "answer_score": r.answer_score,
            "coverage_score": r.coverage_score,
            "semantic_score": r.semantic_score,
            "filler_words_count": r.filler_words_count,
            "point_results": r.point_results or []
        }
        for r in interview.responses
    ]
    questions_data = [
        {
            "id": str(q.id),
            "question_text": q.question_text,
            "expected_points": q.expected_points
        }
        for q in interview.questions
    ]

    report = synthesize_interview_report(responses_data, questions_data)

    interview.final_score = report["final_score"]
    interview.technical_score = report["technical_score"]
    interview.coverage_score = report["coverage_score"]
    interview.relevance_score = report["relevance_score"]
    interview.communication_score = report["communication_score"]
    interview.strengths = report["strengths"]
    interview.improvements = report["improvements"]
    interview.missing_topics = report["missing_topics"]
    interview.status = "completed"
    interview.completed_at = datetime.utcnow()

    # 2. If interview is tied to a specific job or candidate application, link/record score
    if interview.job_id:
        app_row = (
            db.query(Application)
            .filter(
                Application.candidate_id == current_user.id,
                Application.job_id == interview.job_id
            )
            .first()
        )
        if app_row:
            # Sync into existing Interview record for compute_interview fallback
            interview_row = (
                db.query(Interview)
                .filter(
                    Interview.candidate_id == current_user.id,
                    Interview.job_id == interview.job_id
                )
                .first()
            )
            if not interview_row:
                interview_row = Interview(
                    application_id=app_row.id,
                    job_id=interview.job_id,
                    candidate_id=current_user.id,
                    recruiter_id=app_row.job.recruiter_id if app_row.job else current_user.id,
                    interview_type=InterviewType.TECHNICAL,
                    status=InterviewStatus.COMPLETED,
                    title="AI Mock Technical Interview",
                    scheduled_at=interview.started_at,
                    technical_score=int(round(report["technical_score"] / 10.0)),  # 1-10 scale
                    communication_score=int(round(report["communication_score"] / 10.0)),
                    overall_rating=int(round(report["final_score"] / 10.0)),
                    candidate_feedback=f"AI Mock Interview Score: {report['final_score']}%",
                    recruiter_feedback=f"Answer Coverage: {report['coverage_score']}%, Relevance: {report['relevance_score']}%",
                )
                db.add(interview_row)
            else:
                interview_row.status = InterviewStatus.COMPLETED
                interview_row.technical_score = int(round(report["technical_score"] / 10.0))
                interview_row.communication_score = int(round(report["communication_score"] / 10.0))
                interview_row.overall_rating = int(round(report["final_score"] / 10.0))

    db.commit()

    return {
        "message": "Mock interview completed successfully.",
        "final_score": interview.final_score,
        "report": report
    }


@router.get("/{interview_id}/report")
async def get_mock_interview_report(
    interview_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get detailed interview evaluation report with question-by-question point analysis.
    """
    interview = (
        db.query(MockInterview)
        .options(
            joinedload(MockInterview.questions),
            joinedload(MockInterview.responses),
            joinedload(MockInterview.candidate)
        )
        .filter(MockInterview.id == interview_id)
        .first()
    )

    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    # Authorization: Candidate who owns it or Recruiter/Admin
    if current_user.role == UserRole.CANDIDATE and interview.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    # Map responses by question_id
    resp_by_qid = {r.question_id: r for r in interview.responses}

    questions_detail = []
    for q in sorted(interview.questions, key=lambda x: x.question_number):
        resp = resp_by_qid.get(q.id)
        questions_detail.append({
            "question_number": q.question_number,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "category": q.category,
            "difficulty": q.difficulty,
            "expected_points": q.expected_points,
            "transcript": resp.transcript if resp else "No response recorded.",
            "duration_seconds": resp.duration_seconds if resp else 0,
            "answer_score": resp.answer_score if resp else 0.0,
            "coverage_score": resp.coverage_score if resp else 0.0,
            "semantic_score": resp.semantic_score if resp else 0.0,
            "filler_words_count": resp.filler_words_count if resp else 0,
            "point_results": resp.point_results if resp else [
                {"expected_point": p.get("point", str(p)), "matched": False, "confidence": 0.0, "evidence_text": None}
                for p in (q.expected_points or [])
            ],
            "response_status": resp.response_status if resp else "NOT_ATTEMPTED"
        })

    return {
        "interview_id": str(interview.id),
        "candidate_name": interview.candidate.full_name if interview.candidate else "Candidate",
        "role_title": interview.role_title,
        "interview_type": interview.interview_type,
        "final_score": interview.final_score or 0.0,
        "technical_score": interview.technical_score or 0.0,
        "coverage_score": interview.coverage_score or 0.0,
        "relevance_score": interview.relevance_score or 0.0,
        "communication_score": interview.communication_score or 0.0,
        "status": interview.status,
        "total_questions": interview.total_questions,
        "completed_questions": interview.completed_questions,
        "strengths": interview.strengths or [],
        "improvements": interview.improvements or [],
        "missing_topics": interview.missing_topics or [],
        "questions_detail": questions_detail,
        "started_at": interview.started_at.isoformat() if interview.started_at else None,
        "completed_at": interview.completed_at.isoformat() if interview.completed_at else None,
    }


@router.get("/candidate/latest")
async def get_candidate_latest_interview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get candidate's most recent mock interview for dashboard summary widget.
    """
    interview = (
        db.query(MockInterview)
        .filter(MockInterview.candidate_id == current_user.id)
        .order_by(MockInterview.started_at.desc())
        .first()
    )

    if not interview:
        return {"has_interview": False}

    return {
        "has_interview": True,
        "interview_id": str(interview.id),
        "role_title": interview.role_title,
        "status": interview.status,
        "final_score": interview.final_score,
        "total_questions": interview.total_questions,
        "completed_questions": interview.completed_questions,
        "missing_topics_count": len(interview.missing_topics or []),
        "completed_at": interview.completed_at.isoformat() if interview.completed_at else None,
    }


@router.get("/history")
async def get_interview_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all mock interview sessions for the logged in candidate.
    """
    interviews = (
        db.query(MockInterview)
        .filter(MockInterview.candidate_id == current_user.id)
        .order_by(MockInterview.started_at.desc())
        .all()
    )

    return [
        {
            "id": str(i.id),
            "role_title": i.role_title,
            "interview_type": i.interview_type,
            "status": i.status,
            "final_score": i.final_score,
            "technical_score": i.technical_score,
            "communication_score": i.communication_score,
            "total_questions": i.total_questions,
            "completed_questions": i.completed_questions,
            "started_at": i.started_at.isoformat() if i.started_at else None,
            "completed_at": i.completed_at.isoformat() if i.completed_at else None,
        }
        for i in interviews
    ]

