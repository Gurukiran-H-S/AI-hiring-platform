"""
Canonical Aptitude Assessment & Exam Evaluation Service.
Handles:
- Standard Question Bank repository (Numerical, Verbal, Reasoning, Technical)
- Recruiter assessment creation with password hashing & question snapshots
- 6-Digit Launch Code generation with 5-minute pre-exam availability window
- Candidate eligibility verification via job application mapping
- Anti-cheat server-side timer enforcement & randomized question sequencing
- Real-time auto-saving and idempotent submission evaluation with negative marking
"""

import uuid
import secrets
import string
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.aptitude import (
    AptitudeAssessment, AssessmentQuestion, AssessmentLaunchCode,
    AssessmentAttempt, AssessmentAnswer, AptitudeScore
)
from app.models.job import Job
from app.models.application import Application, ApplicationStatus
from app.models.user import User, UserRole
from app.utils.jwt_handler import hash_password, verify_password


# ─── 1. COMPREHENSIVE CURATED QUESTION BANK ───────────────────────────────

QUESTION_BANK: List[Dict[str, Any]] = [
    # Numerical Ability
    {
        "id": "NUM_01",
        "category": "Numerical Ability",
        "difficulty": "Easy",
        "question_text": "A train 125 m long passes a telegraph post in 10 seconds. What is the speed of the train in km/h?",
        "options": ["36 km/h", "45 km/h", "54 km/h", "60 km/h"],
        "correct_answer": "1",
        "marks": 2.0,
        "negative_marks": 0.5,
        "explanation": "Speed = Distance / Time = 125 / 10 = 12.5 m/s. Convert to km/h: 12.5 * 18 / 5 = 45 km/h."
    },
    {
        "id": "NUM_02",
        "category": "Numerical Ability",
        "difficulty": "Medium",
        "question_text": "A sum of money at simple interest amounts to Rs. 815 in 3 years and to Rs. 854 in 4 years. What is the principal sum?",
        "options": ["Rs. 650", "Rs. 690", "Rs. 698", "Rs. 700"],
        "correct_answer": "2",
        "marks": 2.0,
        "negative_marks": 0.5,
        "explanation": "Interest for 1 year = 854 - 815 = 39. Interest for 3 years = 39 * 3 = 117. Principal = 815 - 117 = Rs. 698."
    },
    {
        "id": "NUM_03",
        "category": "Numerical Ability",
        "difficulty": "Medium",
        "question_text": "If 12 men or 18 women can do a work in 14 days, in how many days will 8 men and 16 women do the same work?",
        "options": ["7 days", "8 days", "9 days", "10 days"],
        "correct_answer": "2",
        "marks": 2.0,
        "negative_marks": 0.5,
        "explanation": "12 men = 18 women => 1 man = 1.5 women. 8 men + 16 women = (8 * 1.5) + 16 = 28 women. Days = (18 * 14) / 28 = 9 days."
    },
    {
        "id": "NUM_04",
        "category": "Numerical Ability",
        "difficulty": "Easy",
        "question_text": "The average weight of 8 persons increases by 2.5 kg when a new person comes in place of one of them weighing 65 kg. What is the weight of the new person?",
        "options": ["76 kg", "82 kg", "84 kg", "85 kg"],
        "correct_answer": "3",
        "marks": 2.0,
        "negative_marks": 0.5,
        "explanation": "Total weight increased = 8 * 2.5 = 20 kg. Weight of new person = 65 + 20 = 85 kg."
    },
    {
        "id": "NUM_05",
        "category": "Numerical Ability",
        "difficulty": "Hard",
        "question_text": "Two numbers are in the ratio 3 : 5. If 9 is subtracted from each, the new numbers are in the ratio 12 : 23. Find the smaller number.",
        "options": ["27", "33", "49", "55"],
        "correct_answer": "1",
        "marks": 2.0,
        "negative_marks": 0.5,
        "explanation": "Let numbers be 3x and 5x. (3x - 9)/(5x - 9) = 12/23. Solving gives x = 11. Smaller number is 33."
    },
    # Verbal Ability
    {
        "id": "VER_01",
        "category": "Verbal Ability",
        "difficulty": "Easy",
        "question_text": "Choose the word which is most opposite in meaning to 'Spurious'.",
        "options": ["Genuine", "Fake", "Phony", "Spiritual"],
        "correct_answer": "0",
        "marks": 2.0,
        "negative_marks": 0.5,
        "explanation": "Spurious means false, fake, or not genuine. Its antonym is Genuine."
    },
    {
        "id": "VER_02",
        "category": "Verbal Ability",
        "difficulty": "Easy",
        "question_text": "Complete the sentence: The department head was ______ because the team failed to meet the deadline.",
        "options": ["elated", "indifferent", "exasperated", "placated"],
        "correct_answer": "2",
        "marks": 2.0,
        "negative_marks": 0.5,
        "explanation": "Exasperated means intensely irritated or frustrated."
    },
    {
        "id": "VER_03",
        "category": "Verbal Ability",
        "difficulty": "Medium",
        "question_text": "Identify the grammatically correct sentence:",
        "options": [
            "He is one of those men who does not tell lies.",
            "He is one of those men who do not tell lies.",
            "He is one of those man who does not tell lies.",
            "He is one of those men who did not told lies."
        ],
        "correct_answer": "1",
        "marks": 2.0,
        "negative_marks": 0.5,
        "explanation": "In 'one of those + plural noun + relative pronoun', the relative pronoun refers to the plural noun (men), so the verb is plural (do)."
    },
    {
        "id": "VER_04",
        "category": "Verbal Ability",
        "difficulty": "Medium",
        "question_text": "Select the synonym for 'Equivocal':",
        "options": ["Clear", "Ambiguous", "Certain", "Enthusiastic"],
        "correct_answer": "1",
        "marks": 2.0,
        "negative_marks": 0.5,
        "explanation": "Equivocal means open to more than one interpretation; ambiguous."
    },
    # Reasoning Ability
    {
        "id": "REA_01",
        "category": "Reasoning Ability",
        "difficulty": "Easy",
        "question_text": "Find the next number in the series: 3, 5, 9, 17, 33, ...",
        "options": ["48", "50", "65", "68"],
        "correct_answer": "2",
        "marks": 2.0,
        "negative_marks": 0.5,
        "explanation": "Differences double: 2, 4, 8, 16, 32. 33 + 32 = 65."
    },
    {
        "id": "REA_02",
        "category": "Reasoning Ability",
        "difficulty": "Medium",
        "question_text": "If POPULAR is coded as QPQVMBS, how is FAMOUS coded in that code?",
        "options": ["GBNPTT", "GBNPVR", "GCOPWV", "GBNPVT"],
        "correct_answer": "3",
        "marks": 2.0,
        "negative_marks": 0.5,
        "explanation": "Each letter is shifted by +1: F->G, A->B, M->N, O->P, U->V, S->T."
    },
    {
        "id": "REA_03",
        "category": "Reasoning Ability",
        "difficulty": "Medium",
        "question_text": "Introducing a boy, a girl said, 'He is the son of the daughter of the father of my uncle.' How is the boy related to the girl?",
        "options": ["Brother", "Nephew", "Uncle", "Son-in-law"],
        "correct_answer": "0",
        "marks": 2.0,
        "negative_marks": 0.5,
        "explanation": "Father of uncle = Grandfather. Daughter of grandfather = Mother or Aunt. Son of mother = Brother."
    },
    # Technical Knowledge
    {
        "id": "TECH_01",
        "category": "Technical",
        "difficulty": "Medium",
        "question_text": "What is the worst-case time complexity of QuickSort?",
        "options": ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
        "correct_answer": "2",
        "marks": 2.0,
        "negative_marks": 0.5,
        "explanation": "QuickSort degrades to O(n²) when the chosen pivot is always the smallest or largest element."
    },
    {
        "id": "TECH_02",
        "category": "Technical",
        "difficulty": "Medium",
        "question_text": "Which HTTP status code corresponds to 'Method Not Allowed'?",
        "options": ["401", "403", "404", "405"],
        "correct_answer": "3",
        "marks": 2.0,
        "negative_marks": 0.5,
        "explanation": "405 indicates that the request method is recognized by the server but not supported by the target resource."
    },
    {
        "id": "TECH_03",
        "category": "Technical",
        "difficulty": "Easy",
        "question_text": "In relational databases, which ACID property ensures that transactions are committed permanently even in the event of a system crash?",
        "options": ["Atomicity", "Consistency", "Isolation", "Durability"],
        "correct_answer": "3",
        "marks": 2.0,
        "negative_marks": 0.5,
        "explanation": "Durability guarantees that once a transaction has been committed, it will remain committed even in the case of a system failure."
    }
]


# ─── 2. RECRUITER ASSESSMENT MANAGEMENT ─────────────────────────────────────

def create_aptitude_assessment(
    db: Session,
    recruiter_id: uuid.UUID,
    job_id: uuid.UUID,
    title: str,
    password: str,
    duration_minutes: int = 30,
    total_marks: float = 80.0,
    passing_score: float = 60.0,
    negative_marking: float = 0.5,
    description: Optional[str] = None,
    instructions: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    max_attempts: int = 1,
    shuffle_questions: bool = True,
    shuffle_options: bool = True,
    questions_data: Optional[List[Dict[str, Any]]] = None,
    status: str = "DRAFT",
) -> AptitudeAssessment:
    """
    Create a new job-specific Aptitude Assessment secured with recruiter password hash.
    Stores question snapshots so global bank edits never alter active exams.
    """
    if not password or len(password.strip()) < 6:
        raise ValueError("Assessment security password/PIN must be at least 6 characters.")

    duration_seconds = max(60, int(duration_minutes * 60))
    pwd_hash = hash_password(password.strip())

    assessment = AptitudeAssessment(
        job_id=job_id,
        recruiter_id=recruiter_id,
        title=title.strip(),
        description=description.strip() if description else None,
        instructions=instructions.strip() if instructions else None,
        status=status,
        published_at=datetime.utcnow() if status in ["PUBLISHED", "ACTIVE"] else None,
        password_hash=pwd_hash,
        duration_seconds=duration_seconds,
        total_marks=total_marks,
        passing_score=passing_score,
        negative_marking=negative_marking,
        start_time=start_time,
        end_time=end_time,
        max_attempts=max_attempts,
        shuffle_questions=shuffle_questions,
        shuffle_options=shuffle_options,
        version=1,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(assessment)
    db.flush()

    # Populate question snapshots
    q_list = questions_data if (questions_data and len(questions_data) > 0) else QUESTION_BANK
    for idx, q_item in enumerate(q_list):
        q_row = AssessmentQuestion(
            assessment_id=assessment.id,
            question_id=str(q_item.get("id", f"Q_{idx+1}")),
            question_order=idx,
            question_text=q_item.get("question_text", q_item.get("question", "")),
            options=q_item.get("options", []),
            correct_answer=str(q_item.get("correct_answer", q_item.get("correct", "0"))),
            marks=float(q_item.get("marks", 2.0)),
            negative_marks=float(q_item.get("negative_marks", negative_marking)),
            category=q_item.get("category", "General Ability"),
            difficulty=q_item.get("difficulty", "Medium"),
            explanation=q_item.get("explanation", None)
        )
        db.add(q_row)

    db.commit()
    db.refresh(assessment)

    # Automatically generate initial active launch code
    generate_launch_code(db, assessment)

    return assessment




def verify_assessment_password(assessment: AptitudeAssessment, plain_password: str) -> bool:
    """Verify recruiter assessment password/PIN."""
    if not assessment or not assessment.password_hash or not plain_password:
        return False
    return verify_password(plain_password.strip(), assessment.password_hash)


def delete_aptitude_assessment(
    db: Session,
    assessment: AptitudeAssessment,
    force: bool = False
) -> None:
    """
    Safely delete an aptitude assessment, its questions, and launch codes.
    If completed candidate submissions exist and force is False, raises ValueError.
    """
    completed_attempts = (
        db.query(AssessmentAttempt)
        .filter(
            AssessmentAttempt.assessment_id == assessment.id,
            AssessmentAttempt.status.in_(["SUBMITTED", "AUTO_SUBMITTED"])
        )
        .count()
    )
    if completed_attempts > 0 and not force:
        raise ValueError(
            f"Cannot delete assessment '{assessment.title}' because {completed_attempts} candidate submission(s) exist. Archive the job instead."
        )

    # Clear any Job.assessment_id references
    db.query(Job).filter(Job.assessment_id == assessment.id).update({"assessment_id": None}, synchronize_session=False)

    # Delete answers and attempts
    attempt_ids = [a.id for a in assessment.attempts]
    if attempt_ids:
        db.query(AssessmentAnswer).filter(AssessmentAnswer.attempt_id.in_(attempt_ids)).delete(synchronize_session=False)
        db.query(AptitudeScore).filter(AptitudeScore.attempt_id.in_(attempt_ids)).delete(synchronize_session=False)
        db.query(AssessmentAttempt).filter(AssessmentAttempt.id.in_(attempt_ids)).delete(synchronize_session=False)

    # Delete launch codes
    db.query(AssessmentLaunchCode).filter(AssessmentLaunchCode.assessment_id == assessment.id).delete(synchronize_session=False)

    # Delete questions
    db.query(AssessmentQuestion).filter(AssessmentQuestion.assessment_id == assessment.id).delete(synchronize_session=False)

    # Delete assessment
    db.delete(assessment)
    db.commit()


def generate_launch_code(
    db: Session,
    assessment: AptitudeAssessment,
    force_new: bool = False
) -> AssessmentLaunchCode:
    """
    Generate or retrieve a cryptographically secure 6-digit Launch Code for this assessment.
    Launch window valid from 5 minutes before start_time (or current time) until end_time.
    """
    now = datetime.utcnow()
    
    # If active code exists and not forced, return it
    if not force_new:
        existing = (
            db.query(AssessmentLaunchCode)
            .filter(
                AssessmentLaunchCode.assessment_id == assessment.id,
                AssessmentLaunchCode.status == "ACTIVE",
                AssessmentLaunchCode.expires_at > now
            )
            .order_by(AssessmentLaunchCode.created_at.desc())
            .first()
        )
        if existing:
            return existing

    # Generate 6-digit numeric launch code (e.g. "847291")
    code = "".join(secrets.choice(string.digits) for _ in range(6))
    
    # Calculate validity window
    valid_from = assessment.start_time - timedelta(minutes=5) if assessment.start_time else now
    if assessment.end_time:
        expires_at = assessment.end_time + timedelta(hours=2)
    elif assessment.start_time:
        expires_at = assessment.start_time + timedelta(seconds=assessment.duration_seconds + 7200)
    else:
        expires_at = now + timedelta(days=7)

    launch_code_row = AssessmentLaunchCode(
        assessment_id=assessment.id,
        job_id=assessment.job_id,
        code=code,
        code_hash=hash_password(code),
        valid_from=valid_from,
        expires_at=expires_at,
        status="ACTIVE",
        created_at=now
    )
    db.add(launch_code_row)
    db.commit()
    db.refresh(launch_code_row)
    return launch_code_row


# ─── 3. CANDIDATE ELIGIBILITY & WAITING ROOM ────────────────────────────────

def check_candidate_eligibility(
    db: Session,
    assessment_id: uuid.UUID,
    candidate_id: uuid.UUID
) -> Dict[str, Any]:
    """
    Verify if a candidate is eligible to take a job-specific aptitude assessment.
    Enforces application ownership, time windows, and 5-minute launch code reveal.
    """
    assessment = db.query(AptitudeAssessment).filter(AptitudeAssessment.id == assessment_id).first()
    if not assessment:
        return {"eligible": False, "reason": "Assessment not found."}

    # 1. Candidate must have applied to the specific job (or auto-link application)
    application = (
        db.query(Application)
        .filter(
            Application.candidate_id == candidate_id,
            Application.job_id == assessment.job_id
        )
        .first()
    )
    if not application:
        return {
            "eligible": False,
            "reason": "You must apply for this job posting before taking the aptitude assessment.",
            "assessment_title": assessment.title,
            "job_id": str(assessment.job_id)
        }

    # 2. Check assessment status
    if assessment.status not in ["PUBLISHED", "ACTIVE", "DRAFT"]:
        return {
            "eligible": False,
            "reason": f"Assessment is currently {assessment.status.lower()} and not open for testing.",
            "status": assessment.status
        }


    # 3. Check attempt limit
    completed_attempts = (
        db.query(AssessmentAttempt)
        .filter(
            AssessmentAttempt.assessment_id == assessment.id,
            AssessmentAttempt.candidate_id == candidate_id,
            AssessmentAttempt.status.in_(["SUBMITTED", "AUTO_SUBMITTED"])
        )
        .count()
    )
    if completed_attempts >= assessment.max_attempts:
        return {
            "eligible": False,
            "reason": f"You have already completed the maximum allowed attempts ({assessment.max_attempts}) for this assessment.",
            "already_completed": True,
            "completed_attempts": completed_attempts
        }

    # 4. Check active ongoing attempt (anti-refresh)
    ongoing_attempt = (
        db.query(AssessmentAttempt)
        .filter(
            AssessmentAttempt.assessment_id == assessment.id,
            AssessmentAttempt.candidate_id == candidate_id,
            AssessmentAttempt.status == "IN_PROGRESS"
        )
        .order_by(AssessmentAttempt.started_at.desc())
        .first()
    )
    now = datetime.utcnow()

    if ongoing_attempt:
        if now < ongoing_attempt.expires_at:
            return {
                "eligible": True,
                "has_active_attempt": True,
                "attempt_id": str(ongoing_attempt.id),
                "remaining_seconds": max(0, int((ongoing_attempt.expires_at - now).total_seconds())),
                "assessment_id": str(assessment.id),
                "assessment_title": assessment.title
            }
        else:
            # Auto-submit expired attempt
            submit_candidate_attempt(db, ongoing_attempt.id, candidate_id, is_auto=True)

    # 5. Check exam schedule window & 5-minute launch code countdown
    launch_code_revealed = False
    revealed_code = None
    seconds_until_start = 0
    seconds_until_code_reveal = 0

    if assessment.start_time:
        code_reveal_time = assessment.start_time - timedelta(minutes=5)
        if now < code_reveal_time:
            seconds_until_code_reveal = int((code_reveal_time - now).total_seconds())
            seconds_until_start = int((assessment.start_time - now).total_seconds())
        else:
            launch_code_revealed = True
            # Fetch active launch code
            active_code_row = (
                db.query(AssessmentLaunchCode)
                .filter(
                    AssessmentLaunchCode.assessment_id == assessment.id,
                    AssessmentLaunchCode.status == "ACTIVE",
                    AssessmentLaunchCode.expires_at > now
                )
                .order_by(AssessmentLaunchCode.created_at.desc())
                .first()
            )
            if active_code_row:
                revealed_code = active_code_row.code
    else:
        # If no strict start_time configured, launch code is always available
        launch_code_revealed = True
        active_code_row = (
            db.query(AssessmentLaunchCode)
            .filter(
                AssessmentLaunchCode.assessment_id == assessment.id,
                AssessmentLaunchCode.status == "ACTIVE",
                AssessmentLaunchCode.expires_at > now
            )
            .order_by(AssessmentLaunchCode.created_at.desc())
            .first()
        )
        if active_code_row:
            revealed_code = active_code_row.code

    return {
        "eligible": True,
        "has_active_attempt": False,
        "assessment_id": str(assessment.id),
        "job_id": str(assessment.job_id),
        "assessment_title": assessment.title,
        "description": assessment.description,
        "instructions": assessment.instructions,
        "duration_seconds": assessment.duration_seconds,
        "duration_minutes": round(assessment.duration_seconds / 60),
        "total_marks": assessment.total_marks,
        "negative_marking": assessment.negative_marking,
        "total_questions": len(assessment.questions),
        "start_time": assessment.start_time.isoformat() if assessment.start_time else None,
        "end_time": assessment.end_time.isoformat() if assessment.end_time else None,
        "launch_code_revealed": launch_code_revealed,
        "revealed_launch_code": revealed_code,
        "seconds_until_code_reveal": max(0, seconds_until_code_reveal),
        "seconds_until_start": max(0, seconds_until_start)
    }


# ─── 4. EXAM ATTEMPT LIFECYCLE ──────────────────────────────────────────────

def start_candidate_exam_attempt(
    db: Session,
    assessment_id: uuid.UUID,
    candidate_id: uuid.UUID,
    launch_code: str
) -> Dict[str, Any]:
    """
    Validate launch code and start candidate exam session.
    Assigns randomized question ordering and server-enforced expiration timestamp.
    """
    eligibility = check_candidate_eligibility(db, assessment_id, candidate_id)
    if not eligibility.get("eligible"):
        raise ValueError(eligibility.get("reason", "Not eligible to start this assessment."))

    if eligibility.get("has_active_attempt"):
        return get_ongoing_attempt_state(db, uuid.UUID(eligibility["attempt_id"]), candidate_id)

    assessment = db.query(AptitudeAssessment).filter(AptitudeAssessment.id == assessment_id).first()
    if not assessment:
        raise ValueError("Assessment not found.")

    # Validate Launch Code
    clean_code = (launch_code or "").strip()
    valid_code = (
        db.query(AssessmentLaunchCode)
        .filter(
            AssessmentLaunchCode.assessment_id == assessment.id,
            AssessmentLaunchCode.code == clean_code,
            AssessmentLaunchCode.status == "ACTIVE",
            AssessmentLaunchCode.expires_at > datetime.utcnow()
        )
        .first()
    )
    if not valid_code:
        raise ValueError("Invalid or expired Launch Code. Please check the waiting room code.")

    application = (
        db.query(Application)
        .filter(
            Application.candidate_id == candidate_id,
            Application.job_id == assessment.job_id
        )
        .first()
    )

    now = datetime.utcnow()
    expires_at = now + timedelta(seconds=assessment.duration_seconds)

    # Determine Question Order (Randomized or Default)
    questions = list(assessment.questions)
    if assessment.shuffle_questions:
        # Cryptographic shuffle
        secrets.SystemRandom().shuffle(questions)
    
    question_order_ids = [str(q.id) for q in questions]

    attempt_count = (
        db.query(AssessmentAttempt)
        .filter(
            AssessmentAttempt.assessment_id == assessment.id,
            AssessmentAttempt.candidate_id == candidate_id
        )
        .count()
    )

    attempt = AssessmentAttempt(
        assessment_id=assessment.id,
        assessment_version=assessment.version,
        job_id=assessment.job_id,
        recruiter_id=assessment.recruiter_id,
        candidate_id=candidate_id,
        application_id=application.id,
        attempt_number=attempt_count + 1,
        status="IN_PROGRESS",
        started_at=now,
        expires_at=expires_at,
        question_order=question_order_ids,
        total_marks=assessment.total_marks,
        created_at=now,
        updated_at=now
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return get_ongoing_attempt_state(db, attempt.id, candidate_id)


def get_ongoing_attempt_state(
    db: Session,
    attempt_id: uuid.UUID,
    candidate_id: uuid.UUID
) -> Dict[str, Any]:
    """
    Get ongoing attempt questions (WITHOUT correct answers) and saved answers for candidate resume.
    """
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    if not attempt or attempt.candidate_id != candidate_id:
        raise ValueError("Attempt not found or unauthorized.")

    now = datetime.utcnow()
    # Check if timed out
    if attempt.status == "IN_PROGRESS" and now >= attempt.expires_at:
        return submit_candidate_attempt(db, attempt.id, candidate_id, is_auto=True)

    assessment = attempt.assessment
    saved_answers = {str(a.question_id): a.selected_answer for a in attempt.answers}

    # Load questions in assigned sequence
    questions_map = {str(q.id): q for q in assessment.questions}
    ordered_questions = []
    order_ids = attempt.question_order or [str(q.id) for q in assessment.questions]

    for q_id in order_ids:
        q_obj = questions_map.get(q_id)
        if q_obj:
            ordered_questions.append({
                "id": str(q_obj.id),
                "question_text": q_obj.question_text,
                "options": q_obj.options,
                "marks": q_obj.marks,
                "negative_marks": q_obj.negative_marks,
                "category": q_obj.category,
                "difficulty": q_obj.difficulty
                # NOTE: correct_answer & explanation strictly omitted!
            })

    remaining_seconds = max(0, int((attempt.expires_at - now).total_seconds()))

    return {
        "attempt_id": str(attempt.id),
        "assessment_id": str(assessment.id),
        "assessment_title": assessment.title,
        "instructions": assessment.instructions,
        "duration_seconds": assessment.duration_seconds,
        "started_at": attempt.started_at.isoformat(),
        "expires_at": attempt.expires_at.isoformat(),
        "remaining_seconds": remaining_seconds,
        "status": attempt.status,
        "total_questions": len(ordered_questions),
        "questions": ordered_questions,
        "saved_answers": saved_answers
    }


def save_candidate_answer(
    db: Session,
    attempt_id: uuid.UUID,
    candidate_id: uuid.UUID,
    question_id: uuid.UUID,
    selected_answer: str
) -> Dict[str, Any]:
    """Auto-save candidate's selected answer for a question in real-time."""
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    if not attempt or attempt.candidate_id != candidate_id:
        raise ValueError("Unauthorized attempt.")

    if attempt.status != "IN_PROGRESS":
        raise ValueError("Assessment is already completed or expired.")

    now = datetime.utcnow()
    if now >= attempt.expires_at:
        submit_candidate_attempt(db, attempt_id, candidate_id, is_auto=True)
        raise ValueError("Assessment time has expired.")

    # Find or create answer
    ans_row = (
        db.query(AssessmentAnswer)
        .filter(
            AssessmentAnswer.attempt_id == attempt.id,
            AssessmentAnswer.question_id == question_id
        )
        .first()
    )
    if ans_row:
        ans_row.selected_answer = str(selected_answer)
        ans_row.answered_at = now
    else:
        ans_row = AssessmentAnswer(
            attempt_id=attempt.id,
            question_id=question_id,
            selected_answer=str(selected_answer),
            answered_at=now
        )
        db.add(ans_row)

    attempt.updated_at = now
    db.commit()
    return {"saved": True, "question_id": str(question_id), "selected_answer": selected_answer}


def submit_candidate_attempt(
    db: Session,
    attempt_id: uuid.UUID,
    candidate_id: uuid.UUID,
    is_auto: bool = False
) -> Dict[str, Any]:
    """
    Finalize assessment attempt:
    - Server-side score evaluation with negative marking.
    - Category-wise section breakdown calculation.
    - Idempotent: safe against duplicate submissions.
    """
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    if not attempt:
        raise ValueError("Attempt not found.")

    if attempt.candidate_id != candidate_id:
        raise ValueError("Unauthorized access to attempt.")

    # Idempotent return if already finalized
    if attempt.status in ["SUBMITTED", "AUTO_SUBMITTED"]:
        return get_attempt_result_report(db, attempt.id, candidate_id)

    assessment = attempt.assessment
    questions_map = {str(q.id): q for q in assessment.questions}
    saved_answers = {str(a.question_id): a for a in attempt.answers}

    now = datetime.utcnow()
    total_possible_marks = 0.0
    total_earned_marks = 0.0
    correct_count = 0
    wrong_count = 0
    unanswered_count = 0

    section_stats: Dict[str, Dict[str, Any]] = {}

    for q_id, q_obj in questions_map.items():
        total_possible_marks += q_obj.marks
        cat = q_obj.category or "General"
        if cat not in section_stats:
            section_stats[cat] = {
                "category": cat,
                "total_questions": 0,
                "correct": 0,
                "wrong": 0,
                "unanswered": 0,
                "possible_marks": 0.0,
                "earned_marks": 0.0
            }
        section_stats[cat]["total_questions"] += 1
        section_stats[cat]["possible_marks"] += q_obj.marks

        ans_obj = saved_answers.get(q_id)
        if not ans_obj or ans_obj.selected_answer is None or str(ans_obj.selected_answer).strip() == "":
            unanswered_count += 1
            section_stats[cat]["unanswered"] += 1
            if ans_obj:
                ans_obj.is_correct = False
                ans_obj.marks_awarded = 0.0
        else:
            # Check correctness
            cand_ans = str(ans_obj.selected_answer).strip()
            corr_ans = str(q_obj.correct_answer).strip()
            
            # Match by index or text
            is_correct = (cand_ans == corr_ans)
            if not is_correct and cand_ans.isdigit() and int(cand_ans) < len(q_obj.options):
                # match option text
                is_correct = (q_obj.options[int(cand_ans)] == corr_ans)

            ans_obj.is_correct = is_correct
            if is_correct:
                correct_count += 1
                total_earned_marks += q_obj.marks
                ans_obj.marks_awarded = q_obj.marks
                section_stats[cat]["correct"] += 1
                section_stats[cat]["earned_marks"] += q_obj.marks
            else:
                wrong_count += 1
                penalty = q_obj.negative_marks or 0.0
                total_earned_marks -= penalty
                ans_obj.marks_awarded = -penalty
                section_stats[cat]["wrong"] += 1
                section_stats[cat]["earned_marks"] -= penalty

    # Score clamping
    final_score = max(0.0, round(total_earned_marks, 2))
    if total_possible_marks > 0:
        percentage = max(0.0, min(100.0, round((final_score / total_possible_marks) * 100, 2)))
    else:
        percentage = 0.0

    attempted_count = correct_count + wrong_count
    accuracy = round((correct_count / attempted_count) * 100, 2) if attempted_count > 0 else 0.0
    time_taken = max(1, int((now - attempt.started_at).total_seconds()))

    # Calculate section percentages
    for cat, data in section_stats.items():
        if data["possible_marks"] > 0:
            data["percentage"] = max(0.0, min(100.0, round((max(0.0, data["earned_marks"]) / data["possible_marks"]) * 100, 2)))
        else:
            data["percentage"] = 0.0

    # Update attempt
    attempt.status = "AUTO_SUBMITTED" if is_auto else "SUBMITTED"
    attempt.submitted_at = now
    attempt.score = final_score
    attempt.total_marks = total_possible_marks
    attempt.percentage = percentage
    attempt.accuracy = accuracy
    attempt.correct_count = correct_count
    attempt.wrong_count = wrong_count
    attempt.unanswered_count = unanswered_count
    attempt.time_taken = time_taken
    attempt.section_breakdown = section_stats
    attempt.updated_at = now

    # Also persist into legacy AptitudeScore so candidate rank & stats reflect instantly
    legacy_score = AptitudeScore(
        candidate_id=candidate_id,
        assessment_id=f"JOB_{assessment.job_id}",
        score=int(final_score),
        total_questions=len(questions_map),
        percentage=percentage,
        percentile=percentage,
        taken_at=now
    )
    db.add(legacy_score)

    db.commit()
    db.refresh(attempt)
    return get_attempt_result_report(db, attempt.id, candidate_id)


def get_attempt_result_report(
    db: Session,
    attempt_id: uuid.UUID,
    candidate_id: uuid.UUID
) -> Dict[str, Any]:
    """Generate comprehensive candidate result report."""
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    if not attempt:
        raise ValueError("Attempt not found.")

    assessment = attempt.assessment
    is_passed = (attempt.percentage or 0.0) >= (assessment.passing_score or 60.0)

    time_mins = (attempt.time_taken or 0) // 60
    time_secs = (attempt.time_taken or 0) % 60
    time_formatted = f"{time_mins}m {time_secs:02d}s"

    return {
        "attempt_id": str(attempt.id),
        "assessment_id": str(assessment.id),
        "assessment_title": assessment.title,
        "job_id": str(assessment.job_id),
        "status": attempt.status,
        "is_passed": is_passed,
        "passing_score": assessment.passing_score,
        "score": attempt.score,
        "total_marks": attempt.total_marks,
        "percentage": attempt.percentage,
        "accuracy": attempt.accuracy,
        "correct_count": attempt.correct_count,
        "wrong_count": attempt.wrong_count,
        "unanswered_count": attempt.unanswered_count,
        "total_questions": (attempt.correct_count + attempt.wrong_count + attempt.unanswered_count),
        "time_taken_seconds": attempt.time_taken,
        "time_taken_formatted": time_formatted,
        "submitted_at": attempt.submitted_at.isoformat() if attempt.submitted_at else None,
        "section_breakdown": attempt.section_breakdown or {}
    }


# ─── 5. RECRUITER ANALYTICS & CANDIDATE RANKINGS ────────────────────────────

def get_recruiter_assessment_analytics(
    db: Session,
    assessment_id: uuid.UUID,
    recruiter_id: uuid.UUID
) -> Dict[str, Any]:
    """Retrieve full analytics and candidate ranking table for a recruiter's assessment."""
    assessment = (
        db.query(AptitudeAssessment)
        .filter(
            AptitudeAssessment.id == assessment_id,
            AptitudeAssessment.recruiter_id == recruiter_id
        )
        .first()
    )
    if not assessment:
        raise ValueError("Assessment not found or unauthorized.")

    total_applicants = (
        db.query(Application)
        .filter(Application.job_id == assessment.job_id)
        .count()
    )

    attempts = (
        db.query(AssessmentAttempt)
        .filter(AssessmentAttempt.assessment_id == assessment.id)
        .order_by(AssessmentAttempt.percentage.desc())
        .all()
    )

    completed = [a for a in attempts if a.status in ["SUBMITTED", "AUTO_SUBMITTED"]]
    scores = [a.percentage for a in completed if a.percentage is not None]

    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    highest_score = max(scores) if scores else 0.0
    lowest_score = min(scores) if scores else 0.0
    passed_count = sum(1 for s in scores if s >= (assessment.passing_score or 60.0))
    pass_rate = round((passed_count / len(completed)) * 100, 1) if completed else 0.0

    # Build ranked candidate list
    candidate_rankings = []
    for rank, att in enumerate(completed, start=1):
        user = db.query(User).filter(User.id == att.candidate_id).first()
        time_mins = (att.time_taken or 0) // 60
        time_secs = (att.time_taken or 0) % 60
        candidate_rankings.append({
            "rank": rank,
            "candidate_id": str(att.candidate_id),
            "candidate_name": user.full_name if user else "Candidate",
            "candidate_email": user.email if user else "",
            "score": att.score,
            "percentage": att.percentage,
            "accuracy": att.accuracy,
            "correct_count": att.correct_count,
            "wrong_count": att.wrong_count,
            "unanswered_count": att.unanswered_count,
            "time_taken_formatted": f"{time_mins}m {time_secs:02d}s",
            "is_passed": (att.percentage or 0.0) >= (assessment.passing_score or 60.0),
            "submitted_at": att.submitted_at.isoformat() if att.submitted_at else None,
            "status": att.status
        })

    # Latest active launch code
    latest_code = (
        db.query(AssessmentLaunchCode)
        .filter(
            AssessmentLaunchCode.assessment_id == assessment.id,
            AssessmentLaunchCode.status == "ACTIVE"
        )
        .order_by(AssessmentLaunchCode.created_at.desc())
        .first()
    )

    return {
        "assessment_id": str(assessment.id),
        "job_id": str(assessment.job_id),
        "title": assessment.title,
        "status": assessment.status,
        "total_questions": len(assessment.questions),
        "duration_minutes": round(assessment.duration_seconds / 60),
        "total_marks": assessment.total_marks,
        "negative_marking": assessment.negative_marking,
        "passing_score": assessment.passing_score,
        "active_launch_code": latest_code.code if latest_code else None,
        "launch_code_expires_at": latest_code.expires_at.isoformat() if latest_code else None,
        "summary": {
            "total_applicants": total_applicants,
            "total_attempts": len(attempts),
            "completed": len(completed),
            "in_progress": len(attempts) - len(completed),
            "average_score": avg_score,
            "highest_score": highest_score,
            "lowest_score": lowest_score,
            "passed_count": passed_count,
            "pass_rate": pass_rate
        },
        "candidate_rankings": candidate_rankings
    }
