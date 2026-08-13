from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime
from sqlalchemy import func

from app.database import get_db
from app.models.user import User, UserRole
from app.models.aptitude import AptitudeScore
from app.middleware.auth_middleware import get_current_user

router = APIRouter(tags=["Aptitude Evaluation"])

class AptitudeSubmitRequest(BaseModel):
    assessment_id: str = "TCS_NQT_SET_A"
    score: int
    total_questions: int
    percentage: float

@router.post("/api/aptitude/submit", status_code=status.HTTP_201_CREATED)
def submit_score(
    req: AptitudeSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save an aptitude test score submission for the logged-in candidate."""
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can submit test scores."
        )

    # Calculate percentile based on existing submissions for this assessment
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
    # 1. Total Registered Candidates
    total_candidates = db.query(User).filter(User.role == UserRole.CANDIDATE, User.is_active == True).count()
    if total_candidates == 0:
        total_candidates = 1

    # 2. Get each candidate's maximum percentage for this assessment_id
    subquery = db.query(
        AptitudeScore.candidate_id,
        func.max(AptitudeScore.percentage).label("max_percentage"),
        func.max(AptitudeScore.score).label("max_score")
    ).filter(AptitudeScore.assessment_id == assessment_id).group_by(AptitudeScore.candidate_id).subquery()

    user_score = db.query(subquery).filter(subquery.c.candidate_id == current_user.id).first()

    if not user_score:
        # Candidate has not attempted this assessment yet
        return {
            "candidate_id": str(current_user.id),
            "rank": total_candidates,
            "total_candidates": total_candidates,
            "score": 0.0,
            "assessment_completed": False
        }
    else:
        # Calculate Competition Rank: (number of candidates with strictly higher max score) + 1
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
    """Retrieve candidate stats matching frontend needs."""
    # Count total candidate users registered
    total_candidates = db.query(User).filter(User.role == UserRole.CANDIDATE, User.is_active == True).count()
    if total_candidates == 0:
        total_candidates = 1

    # Total students who have completed this test
    total_taken = db.query(AptitudeScore.candidate_id)\
                    .filter(AptitudeScore.assessment_id == assessment_id)\
                    .distinct().count()

    # Peer average percentage for this test
    peer_avg_res = db.query(func.avg(AptitudeScore.percentage))\
                     .filter(AptitudeScore.assessment_id == assessment_id).scalar()
    peer_avg = round(float(peer_avg_res), 2) if peer_avg_res is not None else 40.0

    # User highest score details for this test
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
    """Retrieve leaderboard listing only registered candidates, sorted by highest percentage."""
    # Subquery to get each candidate's maximum percentage
    subquery = db.query(
        AptitudeScore.candidate_id,
        func.max(AptitudeScore.percentage).label("max_percentage"),
        func.max(AptitudeScore.score).label("max_score"),
        func.max(AptitudeScore.total_questions).label("max_total_questions"),
        func.max(AptitudeScore.percentile).label("max_percentile"),
        func.max(AptitudeScore.taken_at).label("max_taken_at")
    ).filter(AptitudeScore.assessment_id == assessment_id).group_by(AptitudeScore.candidate_id).subquery()

    # Query all candidate users and left join their highest scores
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
