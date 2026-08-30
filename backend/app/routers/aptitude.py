from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import UUID
from sqlalchemy import func

from app.database import get_db
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.application import Application
from app.models.aptitude import (
    AptitudeScore, AptitudeAssessment, AssessmentQuestion,
    AssessmentLaunchCode, AssessmentAttempt, AssessmentAnswer
)
from app.middleware.auth_middleware import get_current_user, get_current_recruiter
from app.services import aptitude_evaluation_service as service

router = APIRouter(tags=["Aptitude Evaluation & Assessment Builder"])


# ─── Pydantic Schemas ────────────────────────────────────────────────────────

class AptitudeSubmitRequest(BaseModel):
    assessment_id: str = "TCS_NQT_SET_A"
    score: int
    total_questions: int
    percentage: float


class AssessmentQuestionSchema(BaseModel):
    id: Optional[str] = None
    question_text: str = Field(..., min_length=5)
    options: List[str] = Field(..., min_items=2)
    correct_answer: str
    marks: float = 2.0
    negative_marks: float = 0.5
    category: str = "General Ability"
    difficulty: str = "Medium"
    explanation: Optional[str] = None


class AssessmentCreateRequest(BaseModel):
    title: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    duration_minutes: int = Field(30, ge=5, le=180)
    total_marks: float = Field(80.0, gt=0)
    passing_score: float = Field(60.0, ge=0, le=100)
    negative_marking: float = Field(0.5, ge=0)
    description: Optional[str] = None
    instructions: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    max_attempts: int = Field(1, ge=1, le=5)
    shuffle_questions: bool = True
    shuffle_options: bool = True
    questions: Optional[List[AssessmentQuestionSchema]] = None


class AssessmentPasswordVerifyRequest(BaseModel):
    password: str = Field(..., min_length=1)


class AssessmentUpdateRequest(BaseModel):
    password: str = Field(..., min_length=1)
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    duration_minutes: Optional[int] = None
    total_marks: Optional[float] = None
    passing_score: Optional[float] = None
    negative_marking: Optional[float] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    shuffle_questions: Optional[bool] = None
    shuffle_options: Optional[bool] = None
    questions: Optional[List[AssessmentQuestionSchema]] = None


class ExamStartRequest(BaseModel):
    launch_code: str = Field(..., min_length=4, max_length=20)


class AnswerSaveRequest(BaseModel):
    question_id: UUID
    selected_answer: str


# ─── 1. RECRUITER ASSESSMENT BUILDER ENDPOINTS ──────────────────────────────

@router.get("/api/recruiter/aptitude-assessments/question-bank")
def get_standard_question_bank(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    current_user: User = Depends(get_current_recruiter)
):
    """Retrieve curated question bank categories for recruiter assessment builder."""
    bank = service.QUESTION_BANK
    if category:
        bank = [q for q in bank if q.get("category", "").lower() == category.lower()]
    if difficulty:
        bank = [q for q in bank if q.get("difficulty", "").lower() == difficulty.lower()]
    return bank


@router.post("/api/recruiter/jobs/{job_id}/aptitude-assessments", status_code=status.HTTP_201_CREATED)
def create_job_aptitude_assessment(
    job_id: UUID,
    req: AssessmentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter)
):
    """Create a new job-specific aptitude assessment secured by recruiter password/PIN."""
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized.")

    q_dicts = [q.dict() for q in req.questions] if req.questions else None

    try:
        assessment = service.create_aptitude_assessment(
            db=db,
            recruiter_id=current_user.id,
            job_id=job.id,
            title=req.title,
            password=req.password,
            duration_minutes=req.duration_minutes,
            total_marks=req.total_marks,
            passing_score=req.passing_score,
            negative_marking=req.negative_marking,
            description=req.description,
            instructions=req.instructions,
            start_time=req.start_time,
            end_time=req.end_time,
            max_attempts=req.max_attempts,
            shuffle_questions=req.shuffle_questions,
            shuffle_options=req.shuffle_options,
            questions_data=q_dicts
        )
        return {
            "message": "Aptitude assessment created successfully in DRAFT mode.",
            "assessment_id": str(assessment.id),
            "status": assessment.status,
            "total_questions": len(assessment.questions)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/recruiter/jobs/{job_id}/aptitude-assessments")
def list_job_aptitude_assessments(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter)
):
    """List all aptitude assessments configured for a specific recruiter job."""
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized.")

    assessments = (
        db.query(AptitudeAssessment)
        .filter(AptitudeAssessment.job_id == job_id, AptitudeAssessment.recruiter_id == current_user.id)
        .order_by(AptitudeAssessment.created_at.desc())
        .all()
    )

    results = []
    for a in assessments:
        attempts_count = db.query(AssessmentAttempt).filter(AssessmentAttempt.assessment_id == a.id).count()
        completed_count = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.assessment_id == a.id,
            AssessmentAttempt.status.in_(["SUBMITTED", "AUTO_SUBMITTED"])
        ).count()
        results.append({
            "id": str(a.id),
            "job_id": str(a.job_id),
            "title": a.title,
            "status": a.status,
            "duration_minutes": round(a.duration_seconds / 60),
            "total_marks": a.total_marks,
            "total_questions": len(a.questions),
            "passing_score": a.passing_score,
            "negative_marking": a.negative_marking,
            "start_time": a.start_time.isoformat() if a.start_time else None,
            "end_time": a.end_time.isoformat() if a.end_time else None,
            "total_attempts": attempts_count,
            "completed_attempts": completed_count,
            "created_at": a.created_at.isoformat()
        })

    return results


@router.get("/api/recruiter/aptitude-assessments/{assessment_id}")
def get_recruiter_assessment_detail(
    assessment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter)
):
    """Get full assessment configuration including question list (recruiter view)."""
    assessment = (
        db.query(AptitudeAssessment)
        .filter(AptitudeAssessment.id == assessment_id, AptitudeAssessment.recruiter_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    questions = [
        {
            "id": str(q.id),
            "question_order": q.question_order,
            "question_text": q.question_text,
            "options": q.options,
            "correct_answer": q.correct_answer,
            "marks": q.marks,
            "negative_marks": q.negative_marks,
            "category": q.category,
            "difficulty": q.difficulty,
            "explanation": q.explanation
        }
        for q in assessment.questions
    ]

    latest_code = (
        db.query(AssessmentLaunchCode)
        .filter(AssessmentLaunchCode.assessment_id == assessment.id, AssessmentLaunchCode.status == "ACTIVE")
        .order_by(AssessmentLaunchCode.created_at.desc())
        .first()
    )

    return {
        "id": str(assessment.id),
        "job_id": str(assessment.job_id),
        "title": assessment.title,
        "description": assessment.description,
        "instructions": assessment.instructions,
        "status": assessment.status,
        "duration_minutes": round(assessment.duration_seconds / 60),
        "duration_seconds": assessment.duration_seconds,
        "total_marks": assessment.total_marks,
        "passing_score": assessment.passing_score,
        "negative_marking": assessment.negative_marking,
        "start_time": assessment.start_time.isoformat() if assessment.start_time else None,
        "end_time": assessment.end_time.isoformat() if assessment.end_time else None,
        "max_attempts": assessment.max_attempts,
        "shuffle_questions": assessment.shuffle_questions,
        "shuffle_options": assessment.shuffle_options,
        "version": assessment.version,
        "active_launch_code": latest_code.code if latest_code else None,
        "questions": questions
    }


@router.post("/api/recruiter/aptitude-assessments/{assessment_id}/verify-password")
def verify_assessment_security_password(
    assessment_id: UUID,
    req: AssessmentPasswordVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter)
):
    """Verify recruiter assessment password before unlocking editing or sensitive actions."""
    assessment = (
        db.query(AptitudeAssessment)
        .filter(AptitudeAssessment.id == assessment_id, AptitudeAssessment.recruiter_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    if not service.verify_assessment_password(assessment, req.password):
        raise HTTPException(status_code=401, detail="Incorrect assessment security password or PIN.")

    return {"verified": True, "message": "Password verified successfully. Authorization granted."}


@router.put("/api/recruiter/aptitude-assessments/{assessment_id}")
def update_aptitude_assessment(
    assessment_id: UUID,
    req: AssessmentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter)
):
    """Update assessment configuration. Requires password verification and locks if attempts exist."""
    assessment = (
        db.query(AptitudeAssessment)
        .filter(AptitudeAssessment.id == assessment_id, AptitudeAssessment.recruiter_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    # Verify Password
    if not service.verify_assessment_password(assessment, req.password):
        raise HTTPException(status_code=401, detail="Incorrect assessment security password.")

    # Guard: Locked if active attempts already completed/in-progress
    attempt_count = db.query(AssessmentAttempt).filter(AssessmentAttempt.assessment_id == assessment.id).count()
    if attempt_count > 0 and (req.questions is not None or req.negative_marking is not None or req.duration_minutes is not None):
        raise HTTPException(
            status_code=400,
            detail="Assessment has recorded attempts. Modifications to questions or duration are locked to preserve fair evaluation."
        )

    if req.title is not None:
        assessment.title = req.title.strip()
    if req.description is not None:
        assessment.description = req.description.strip()
    if req.instructions is not None:
        assessment.instructions = req.instructions.strip()
    if req.duration_minutes is not None:
        assessment.duration_seconds = max(60, int(req.duration_minutes * 60))
    if req.total_marks is not None:
        assessment.total_marks = req.total_marks
    if req.passing_score is not None:
        assessment.passing_score = req.passing_score
    if req.negative_marking is not None:
        assessment.negative_marking = req.negative_marking
    if req.start_time is not None:
        assessment.start_time = req.start_time
    if req.end_time is not None:
        assessment.end_time = req.end_time
    if req.shuffle_questions is not None:
        assessment.shuffle_questions = req.shuffle_questions
    if req.shuffle_options is not None:
        assessment.shuffle_options = req.shuffle_options

    if req.questions is not None and len(req.questions) > 0:
        # Replace questions
        db.query(AssessmentQuestion).filter(AssessmentQuestion.assessment_id == assessment.id).delete()
        for idx, q_item in enumerate(req.questions):
            q_row = AssessmentQuestion(
                assessment_id=assessment.id,
                question_id=str(q_item.id or f"Q_{idx+1}"),
                question_order=idx,
                question_text=q_item.question_text,
                options=q_item.options,
                correct_answer=q_item.correct_answer,
                marks=q_item.marks,
                negative_marks=q_item.negative_marks,
                category=q_item.category,
                difficulty=q_item.difficulty,
                explanation=q_item.explanation
            )
            db.add(q_row)

    assessment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(assessment)
    return {"message": "Assessment updated successfully.", "assessment_id": str(assessment.id)}


@router.post("/api/recruiter/aptitude-assessments/{assessment_id}/publish")
def publish_aptitude_assessment(
    assessment_id: UUID,
    req: AssessmentPasswordVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter)
):
    """Publish assessment and automatically generate initial Launch Code."""
    assessment = (
        db.query(AptitudeAssessment)
        .filter(AptitudeAssessment.id == assessment_id, AptitudeAssessment.recruiter_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    if not service.verify_assessment_password(assessment, req.password):
        raise HTTPException(status_code=401, detail="Incorrect assessment security password.")

    if len(assessment.questions) == 0:
        raise HTTPException(status_code=400, detail="Cannot publish assessment with zero questions.")

    assessment.status = "PUBLISHED"
    assessment.published_at = datetime.utcnow()
    assessment.updated_at = datetime.utcnow()

    # Generate Launch Code
    launch_code = service.generate_launch_code(db, assessment)

    db.commit()
    return {
        "message": "Assessment published successfully and ready for candidate examinations.",
        "status": assessment.status,
        "launch_code": launch_code.code,
        "valid_from": launch_code.valid_from.isoformat(),
        "expires_at": launch_code.expires_at.isoformat()
    }


@router.post("/api/recruiter/aptitude-assessments/{assessment_id}/launch-code")
def generate_or_refresh_launch_code(
    assessment_id: UUID,
    req: AssessmentPasswordVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter)
):
    """Regenerate a new secure 6-digit Launch Code for candidate examination session."""
    assessment = (
        db.query(AptitudeAssessment)
        .filter(AptitudeAssessment.id == assessment_id, AptitudeAssessment.recruiter_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    if not service.verify_assessment_password(assessment, req.password):
        raise HTTPException(status_code=401, detail="Incorrect assessment security password.")

    code_obj = service.generate_launch_code(db, assessment, force_new=True)
    return {
        "message": "New Launch Code generated successfully.",
        "launch_code": code_obj.code,
        "valid_from": code_obj.valid_from.isoformat(),
        "expires_at": code_obj.expires_at.isoformat()
    }


@router.get("/api/recruiter/aptitude-assessments/{assessment_id}/results")
def get_assessment_candidate_results(
    assessment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter)
):
    """Get complete candidate rankings, analytics, and pass/fail summary for an assessment."""
    try:
        return service.get_recruiter_assessment_analytics(db, assessment_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─── 2. CANDIDATE EXAMINATION & LAUNCH CODE ENDPOINTS ───────────────────────

@router.get("/api/candidate/aptitude-assessments")
def list_candidate_available_assessments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List aptitude assessments for jobs the candidate has applied to,
    including eligibility status, schedule, and attempt count.
    """
    applications = db.query(Application).filter(Application.candidate_id == current_user.id).all()
    applied_job_ids = {app.job_id for app in applications if app.job_id}
    applied_titles = {app.job.title.lower().strip() for app in applications if app.job and app.job.title}
    app_map = {app.job_id: app for app in applications if app.job_id}

    # Fetch all assessments across candidate's applied jobs and all active jobs
    all_active_jobs = db.query(Job).filter(Job.status == JobStatus.ACTIVE).all()
    all_job_ids = [j.id for j in all_active_jobs]

    assessments = (
        db.query(AptitudeAssessment)
        .filter(AptitudeAssessment.job_id.in_(all_job_ids + list(applied_job_ids)))
        .order_by(AptitudeAssessment.created_at.desc())
        .all()
    ) if (all_job_ids or applied_job_ids) else []

    results = []
    seen_ids = set()

    for a in assessments:
        if a.id in seen_ids:
            continue
        seen_ids.add(a.id)

        job = db.query(Job).filter(Job.id == a.job_id).first()
        app = app_map.get(a.job_id)
        is_applied = (a.job_id in applied_job_ids) or (job and job.title.lower().strip() in applied_titles)
        
        # Check attempts
        completed_attempt = (
            db.query(AssessmentAttempt)
            .filter(
                AssessmentAttempt.assessment_id == a.id,
                AssessmentAttempt.candidate_id == current_user.id,
                AssessmentAttempt.status.in_(["SUBMITTED", "AUTO_SUBMITTED"])
            )
            .order_by(AssessmentAttempt.submitted_at.desc())
            .first()
        )

        ongoing_attempt = (
            db.query(AssessmentAttempt)
            .filter(
                AssessmentAttempt.assessment_id == a.id,
                AssessmentAttempt.candidate_id == current_user.id,
                AssessmentAttempt.status == "IN_PROGRESS"
            )
            .first()
        )

        results.append({
            "id": str(a.id),
            "job_id": str(a.job_id),
            "job_title": job.title if job else "Job Assessment",
            "company": job.company if job else "Recruiter Assessment",
            "title": a.title,
            "description": a.description,
            "duration_minutes": round(a.duration_seconds / 60),
            "total_marks": a.total_marks,
            "total_questions": len(a.questions),
            "negative_marking": a.negative_marking,
            "passing_score": a.passing_score,
            "start_time": a.start_time.isoformat() if a.start_time else None,
            "end_time": a.end_time.isoformat() if a.end_time else None,
            "is_applied": is_applied,
            "application_status": app.status.value if (app and hasattr(app.status, 'value')) else str(app.status) if app else "open",
            "is_completed": completed_attempt is not None,
            "score": completed_attempt.score if completed_attempt else None,
            "percentage": completed_attempt.percentage if completed_attempt else None,
            "is_passed": (completed_attempt.percentage or 0.0) >= (a.passing_score or 60.0) if completed_attempt else None,
            "has_active_attempt": ongoing_attempt is not None,
            "active_attempt_id": str(ongoing_attempt.id) if ongoing_attempt else None
        })

    return results



@router.get("/api/candidate/aptitude-assessments/{assessment_id}/eligibility")
def get_candidate_assessment_eligibility(
    assessment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check waiting room eligibility, schedule countdown, and reveal launch code if <= 5 mins."""
    eligibility = service.check_candidate_eligibility(db, assessment_id, current_user.id)
    return eligibility


@router.post("/api/candidate/aptitude-assessments/{assessment_id}/start")
def start_candidate_aptitude_exam(
    assessment_id: UUID,
    req: ExamStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Validate Launch Code, verify application eligibility, and begin timed exam session.
    Returns randomized questions (WITHOUT correct answers) and server timers.
    """
    try:
        return service.start_candidate_exam_attempt(
            db=db,
            assessment_id=assessment_id,
            candidate_id=current_user.id,
            launch_code=req.launch_code
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/candidate/aptitude-attempts/{attempt_id}")
def resume_candidate_exam_attempt(
    attempt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Anti-refresh resume: fetch ongoing attempt state, remaining server seconds, and saved answers."""
    try:
        return service.get_ongoing_attempt_state(db, attempt_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/api/candidate/aptitude-attempts/{attempt_id}/answer")
def auto_save_exam_answer(
    attempt_id: UUID,
    req: AnswerSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Real-time auto-saving of candidate's selected answer for a single question."""
    try:
        return service.save_candidate_answer(
            db=db,
            attempt_id=attempt_id,
            candidate_id=current_user.id,
            question_id=req.question_id,
            selected_answer=req.selected_answer
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/api/candidate/aptitude-attempts/{attempt_id}/submit")
def submit_exam_attempt(
    attempt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Finalize and evaluate exam attempt. Calculates score, negative marking, and section breakdown."""
    try:
        return service.submit_candidate_attempt(
            db=db,
            attempt_id=attempt_id,
            candidate_id=current_user.id,
            is_auto=False
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/candidate/aptitude-attempts/{attempt_id}/result")
def get_exam_result(
    attempt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve detailed result report for a completed assessment attempt."""
    try:
        return service.get_attempt_result_report(db, attempt_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─── 3. LEGACY GENERAL PRACTICE APTITUDE ENDPOINTS (PRESERVED) ──────────────

@router.post("/api/aptitude/submit", status_code=status.HTTP_201_CREATED)
def submit_score(
    req: AptitudeSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save an aptitude test score submission for candidate general practice."""
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can submit test scores."
        )

    all_scores = db.query(AptitudeScore.percentage)\
                   .filter(AptitudeScore.assessment_id == req.assessment_id)\
                   .distinct().order_by(AptitudeScore.percentage.asc()).all()
    all_scores = [s[0] for s in all_scores]
    
    if not all_scores:
        percentile = 100.0
    else:
        below_count = sum(1 for s in all_scores if s < req.percentage)
        percentile = round((below_count / len(all_scores)) * 100, 2)
        if percentile == 0.0 and req.percentage > 0:
            percentile = 10.0

    score_entry = AptitudeScore(
        candidate_id=current_user.id,
        assessment_id=req.assessment_id,
        score=req.score,
        total_questions=req.total_questions,
        percentage=req.percentage,
        percentile=percentile,
        taken_at=datetime.utcnow()
    )
    db.add(score_entry)
    db.commit()
    db.refresh(score_entry)
    return {"message": "Score submitted successfully", "percentile": percentile}


@router.get("/api/candidate/rank")
def get_candidate_rank(
    assessment_id: str = "TCS_NQT_SET_A",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve rank details dynamically for the authenticated candidate."""
    total_candidates = db.query(User).filter(User.role == UserRole.CANDIDATE, User.is_active == True).count()
    if total_candidates == 0:
        total_candidates = 1

    subquery = db.query(
        AptitudeScore.candidate_id,
        func.max(AptitudeScore.percentage).label("max_percentage"),
        func.max(AptitudeScore.score).label("max_score")
    ).filter(AptitudeScore.assessment_id == assessment_id).group_by(AptitudeScore.candidate_id).subquery()

    user_score = db.query(subquery).filter(subquery.c.candidate_id == current_user.id).first()

    if not user_score:
        return {
            "candidate_id": str(current_user.id),
            "rank": total_candidates,
            "total_candidates": total_candidates,
            "score": 0.0,
            "assessment_completed": False
        }
    else:
        better_candidates = db.query(subquery).filter(subquery.c.max_percentage > user_score.max_percentage).count()
        rank = better_candidates + 1
        return {
            "candidate_id": str(current_user.id),
            "rank": rank,
            "total_candidates": total_candidates,
            "score": round(user_score.max_percentage, 2),
            "assessment_completed": True
        }


@router.get("/api/aptitude/stats")
def get_aptitude_stats(
    assessment_id: str = "TCS_NQT_SET_A",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve candidate practice stats."""
    total_candidates = db.query(User).filter(User.role == UserRole.CANDIDATE, User.is_active == True).count()
    if total_candidates == 0:
        total_candidates = 1

    total_taken = db.query(AptitudeScore.candidate_id)\
                    .filter(AptitudeScore.assessment_id == assessment_id)\
                    .distinct().count()

    peer_avg_res = db.query(func.avg(AptitudeScore.percentage))\
                     .filter(AptitudeScore.assessment_id == assessment_id).scalar()
    peer_avg = round(float(peer_avg_res), 2) if peer_avg_res is not None else 40.0

    user_scores = db.query(AptitudeScore)\
                    .filter(AptitudeScore.candidate_id == current_user.id, AptitudeScore.assessment_id == assessment_id)\
                    .order_by(AptitudeScore.percentage.desc()).all()

    user_highest_percentage = user_scores[0].percentage if user_scores else 0.0
    user_highest_score = user_scores[0].score if user_scores else 0
    user_highest_percentile = user_scores[0].percentile if user_scores else 0.0

    rank = total_candidates
    if user_scores:
        subquery = db.query(
            AptitudeScore.candidate_id,
            func.max(AptitudeScore.percentage).label("max_percentage")
        ).filter(AptitudeScore.assessment_id == assessment_id).group_by(AptitudeScore.candidate_id).subquery()

        better_candidates = db.query(subquery).filter(subquery.c.max_percentage > user_highest_percentage).count()
        rank = better_candidates + 1

    return {
        "total_candidates": total_candidates,
        "total_taken": total_taken,
        "peer_average": peer_avg,
        "personal_rank": rank,
        "personal_highest_percentage": user_highest_percentage,
        "personal_highest_score": user_highest_score,
        "personal_highest_percentile": user_highest_percentile,
        "has_attempts": len(user_scores) > 0
    }


@router.get("/api/aptitude/leaderboard")
def get_leaderboard(
    assessment_id: str = "TCS_NQT_SET_A",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve leaderboard for general practice test."""
    subquery = db.query(
        AptitudeScore.candidate_id,
        func.max(AptitudeScore.percentage).label("max_percentage"),
        func.max(AptitudeScore.score).label("max_score"),
        func.max(AptitudeScore.total_questions).label("max_total_questions"),
        func.max(AptitudeScore.percentile).label("max_percentile"),
        func.max(AptitudeScore.taken_at).label("max_taken_at")
    ).filter(AptitudeScore.assessment_id == assessment_id).group_by(AptitudeScore.candidate_id).subquery()

    candidates = db.query(
        User.id.label("user_id"),
        User.full_name,
        subquery.c.max_percentage,
        subquery.c.max_score,
        subquery.c.max_total_questions,
        subquery.c.max_percentile,
        subquery.c.max_taken_at
    ).filter(User.role == UserRole.CANDIDATE, User.is_active == True)\
     .outerjoin(subquery, User.id == subquery.c.candidate_id)\
     .order_by(
         func.coalesce(subquery.c.max_percentage, -1.0).desc(),
         User.full_name.asc()
     ).all()

    leaderboard = []
    for idx, row in enumerate(candidates):
        has_taken = row.max_percentage is not None
        leaderboard.append({
            "rank": idx + 1,
            "name": row.full_name,
            "percentage": round(row.max_percentage, 2) if has_taken else 0.0,
            "score": row.max_score if has_taken else 0,
            "total_questions": row.max_total_questions if has_taken else 0,
            "percentile": round(row.max_percentile, 2) if (has_taken and row.max_percentile) else 0.0,
            "date": row.max_taken_at.strftime("%Y-%m-%d") if (has_taken and row.max_taken_at) else "Not Attempted",
            "is_current_user": row.user_id == current_user.id
        })

    return leaderboard
