"""
Deterministic Job Evaluation & Candidate Ranking Engine
=======================================================

Core rules (see recruiter evaluation spec):
- Weights are PERCENTAGES and MUST total exactly 100. Never normalized.
- Overall = ATS*w_ats + Coding*w_code + Skill*w_skill + Interview*w_int
  (weights as decimals). Result clamped to [0, 100].
- Every component score comes from real data - no fabricated defaults.
- Missing components are flagged (NOT_ATTEMPTED / PENDING), never silently
  scored as 0 or a made-up number. Overall is computed from available
  components and labelled partial when completeness < 100%.
- Ranking is deterministic with explicit tie-breaking.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.coding import (
    CandidateSubmission,
    CodingProblem,
    RecruiterAssessmentAttempt,
    SubmissionStatus,
)
from app.models.evaluation import EvaluationWeight
from app.models.interview import Interview, InterviewStatus
from app.models.job import Job
from app.models.resume import Resume
from app.ai.skill_normalizer import skill_normalizer

logger = logging.getLogger(__name__)

# ── Defaults (percent units, total = 100) ──────────────────────────────────
DEFAULT_WEIGHTS = {
    "ats_weight": 20.0,
    "coding_weight": 25.0,
    "skill_weight": 30.0,
    "interview_weight": 25.0,
}
WEIGHT_KEYS = list(DEFAULT_WEIGHTS.keys())

# Statuses counted as valid judged submissions for accuracy
JUDGED_STATUSES = {
    SubmissionStatus.ACCEPTED,
    SubmissionStatus.WRONG_ANSWER,
    SubmissionStatus.TIME_LIMIT_EXCEEDED,
    SubmissionStatus.MEMORY_LIMIT_EXCEEDED,
    SubmissionStatus.PRESENTATION_ERROR,
}
ACCEPTED_STATUSES = {SubmissionStatus.ACCEPTED}


class WeightValidationError(ValueError):
    def __init__(self, total: float):
        self.total_weight = total
        super().__init__("Weights must total exactly 100%")


# ═══════════════════════════════ WEIGHTS ═══════════════════════════════

def validate_weights(ats: float, coding: float, skill: float, interview: float) -> float:
    """Validate a percentage weight config; returns the total.
    Raises WeightValidationError when total != 100 or any weight invalid."""
    vals = [ats, coding, skill, interview]
    for v in vals:
        if v is None or isinstance(v, bool) or not isinstance(v, (int, float)):
            raise WeightValidationError(float("nan"))
        if v < 0 or v > 100:
            raise WeightValidationError(float("nan"))
    total = round(float(ats) + float(coding) + float(skill) + float(interview), 6)
    if abs(total - 100.0) > 1e-6:
        raise WeightValidationError(total)
    return 100.0


def _load_raw_weights(db: Session, job_id: Any) -> Dict[str, float]:
    row = db.query(EvaluationWeight).filter(EvaluationWeight.job_id == job_id).first()
    if not row:
        return dict(DEFAULT_WEIGHTS)
    raw = {k: float(getattr(row, k) or 0.0) for k in WEIGHT_KEYS}
    # Legacy migration: rows stored as decimals (0.20/0.25/... sum≈1.0)
    if 0 < sum(raw.values()) <= 1.001:
        raw = {k: round(v * 100.0, 2) for k, v in raw.items()}
    return raw


def get_job_weights_percent(db: Session, job_id: Any) -> Dict[str, Any]:
    """Job weights in percent units with validity info."""
    w = _load_raw_weights(db, job_id)
    total = round(sum(w.values()), 2)
    return {
        **{k: round(v, 2) for k, v in w.items()},
        "total_weight": total,
        "is_valid": abs(total - 100.0) < 1e-6,
        "is_default": not db.query(EvaluationWeight).filter(EvaluationWeight.job_id == job_id).first(),
    }


def save_job_weights(db: Session, job_id: Any, weights: Dict[str, float]) -> None:
    """Persist weights as percentages. Raises WeightValidationError if != 100."""
    validate_weights(
        weights["ats_weight"], weights["coding_weight"],
        weights["skill_weight"], weights["interview_weight"],
    )
    row = db.query(EvaluationWeight).filter(EvaluationWeight.job_id == job_id).first()
    if not row:
        row = EvaluationWeight(job_id=job_id)
        db.add(row)
    for k in WEIGHT_KEYS:
        setattr(row, k, float(weights[k]))
    row.updated_at = datetime.utcnow()
    db.commit()


# ═══════════════════════════════ COMPONENTS ═══════════════════════════════

def _clamp(v: float) -> float:
    return round(max(0.0, min(100.0, float(v))), 2)


def compute_ats(db: Session, application: Optional[Application], candidate_id: Any) -> Dict[str, Any]:
    """ATS from stored data only. Prefers job-specific application ATS,
    falls back to the candidate's primary resume ATS. Never invents a number."""
    if application and application.ats_score is not None:
        return {
            "score": _clamp(application.ats_score),
            "status": "SCORED",
            "source": "job_specific_ats",
            "label": "Job ATS Match",
        }
    resume = None
    if application and application.resume:
        resume = application.resume
    if resume is None:
        resume = (
            db.query(Resume)
            .filter(Resume.user_id == candidate_id, Resume.is_parsed == True)  # noqa: E712
            .order_by(Resume.created_at.desc())
            .first()
        )
    if resume and resume.ats_score is not None:
        return {
            "score": _clamp(resume.ats_score),
            "status": "SCORED",
            "source": "resume_quality_ats",
            "label": "Resume ATS (generic quality score)",
        }
    return {"score": None, "status": "NOT_ATTEMPTED", "source": None, "label": "No parsed resume"}


def compute_skill_match(job: Optional[Job], resume: Optional[Resume]) -> Dict[str, Any]:
    """Deterministic required/preferred skill overlap with alias normalization.
    Required skills carry 80% of the component, preferred 20%."""
    if job is None:
        return {"score": None, "status": "NOT_ATTEMPTED", "matched": [], "missing": [],
                "required_count": 0, "preferred_count": 0}
    raw_required = job.required_skills or []
    raw_preferred = job.preferred_skills or []

    if not raw_required and not raw_preferred:
        # No requirements defined -> cannot penalize the candidate
        return {"score": 100.0, "status": "NOT_DEFINED", "matched": [], "missing": [],
                "required_count": 0, "preferred_count": 0,
                "note": "No required skills defined for this job"}

    cand_raw = (resume.parsed_skills if resume else None) or []
    cand = {skill_normalizer.normalize(s)["normalized_skill"].lower() for s in cand_raw}

    def overlap(skills: List[str]) -> Tuple[List[str], List[str]]:
        norm = [skill_normalizer.normalize(s)["normalized_skill"].lower() for s in skills]
        matched = [s for s, n in zip(skills, norm) if n in cand]
        missing = [s for s, n in zip(skills, norm) if n not in cand]
        return matched, missing

    req_matched, req_missing = overlap(raw_required)
    pref_matched, pref_missing = overlap(raw_preferred)

    req_score = (len(req_matched) / len(raw_required) * 100.0) if raw_required else None
    pref_score = (len(pref_matched) / len(raw_preferred) * 100.0) if raw_preferred else None

    if req_score is not None and pref_score is not None:
        score = req_score * 0.8 + pref_score * 0.2
    elif req_score is not None:
        score = req_score
    else:
        score = pref_score

    return {
        "score": _clamp(score),
        "status": "SCORED",
        "matched": req_matched + pref_matched,
        "missing": req_missing,
        "required_count": len(raw_required),
        "preferred_count": len(raw_preferred),
        "formula": (
            f"required {len(req_matched)}/{len(raw_required)} (80%)"
            + (f" + preferred {len(pref_matched)}/{len(raw_preferred)} (20%)" if raw_preferred else "")
        ),
    }


def compute_coding(db: Session, candidate_id: Any, job: Optional[Job]) -> Dict[str, Any]:
    """Coding score strictly from judge results.
    Priority: job assessment attempt score -> per-problem earned/max points."""
    # 1. Job-specific assessment attempt
    if job is not None and getattr(job, "assessment_id", None):
        attempt = (
            db.query(RecruiterAssessmentAttempt)
            .filter(
                RecruiterAssessmentAttempt.assessment_id == job.assessment_id,
                RecruiterAssessmentAttempt.candidate_id == candidate_id,
            )
            .order_by(RecruiterAssessmentAttempt.submitted_at.desc().nullslast())
            .first()
        )
        if attempt and attempt.status == "submitted":
            max_pts = float(attempt.total_points or 100)
            return {
                "score": _clamp((float(attempt.score or 0) / max_pts) * 100.0),
                "status": "SCORED",
                "source": "job_assessment",
                "earned_points": float(attempt.score or 0),
                "max_points": max_pts,
                "formula": f"{attempt.score}/{attempt.total_points} x 100",
            }
        return {"score": None, "status": "PENDING", "source": "job_assessment",
                "note": "Assessment assigned but not submitted"}

    # 2. Practice submissions: earned points / max points of attempted problems
    subs = (
        db.query(CandidateSubmission)
        .filter(CandidateSubmission.candidate_id == candidate_id)
        .all()
    )
    if not subs:
        return {"score": None, "status": "NOT_ATTEMPTED", "source": "practice"}

    problem_ids = {s.problem_id for s in subs}
    problems = {p.id: p for p in db.query(CodingProblem).filter(CodingProblem.id.in_(problem_ids)).all()}

    def difficulty_points(p) -> int:
        d = p.difficulty.value if hasattr(p.difficulty, "value") else str(p.difficulty)
        return {"Easy": 100, "Medium": 200, "Hard": 300}.get(d, 100)

    earned, attempted_max = 0.0, 0.0
    solved = {"Easy": 0, "Medium": 0, "Hard": 0}
    solved_ids, attempted_ids = set(), set()
    total_subs = accepted = wrong = runtime_err = compile_err = 0

    for s in subs:
        total_subs += 1
        status = s.status
        if status in ACCEPTED_STATUSES:
            accepted += 1
        elif status == SubmissionStatus.WRONG_ANSWER:
            wrong += 1
        elif status in (SubmissionStatus.RUNTIME_ERROR, SubmissionStatus.INTERNAL_ERROR):
            runtime_err += 1
        elif status == SubmissionStatus.COMPILATION_ERROR:
            compile_err += 1

        p = problems.get(s.problem_id)
        if p is None:
            continue
        attempted_ids.add(s.problem_id)
        attempted_max += difficulty_points(p)
        if status in ACCEPTED_STATUSES and s.problem_id not in solved_ids:
            solved_ids.add(s.problem_id)
            d = p.difficulty.value if hasattr(p.difficulty, "value") else str(p.difficulty)
            solved[d] = solved.get(d, 0) + 1
            earned += difficulty_points(p)

    if attempted_max <= 0:
        return {"score": None, "status": "NOT_ATTEMPTED", "source": "practice"}

    judged = accepted + wrong + sum(
        1 for s in subs if s.status in (
            SubmissionStatus.TIME_LIMIT_EXCEEDED,
            SubmissionStatus.MEMORY_LIMIT_EXCEEDED,
            SubmissionStatus.PRESENTATION_ERROR,
        )
    )
    accuracy = (accepted / judged * 100.0) if judged > 0 else 0.0

    return {
        "score": _clamp(earned / attempted_max * 100.0),
        "status": "SCORED",
        "source": "practice_submissions",
        "earned_points": earned,
        "max_points": attempted_max,
        "formula": f"{earned:.0f}/{attempted_max:.0f} points x 100",
        "problems_solved": len(solved_ids),
        "problems_attempted": len(attempted_ids),
        "solved_by_difficulty": solved,
        "total_points": int(earned),
        "total_submissions": total_subs,
        "accepted_submissions": accepted,
        "wrong_answers": wrong,
        "runtime_errors": runtime_err,
        "compile_errors": compile_err,
        "accuracy": round(accuracy, 1),
    }


def compute_interview(db: Session, job_id: Any, candidate_id: Any) -> Dict[str, Any]:
    """Interview score from completed interview feedback (1-10 scales -> 0-100)."""
    interviews = (
        db.query(Interview)
        .filter(Interview.job_id == job_id, Interview.candidate_id == candidate_id)
        .all()
    )
    completed = [i for i in interviews if i.status == InterviewStatus.COMPLETED]
    if not completed:
        status = "NOT_ATTEMPTED" if not interviews else "PENDING"
        return {"score": None, "status": status, "interviews_total": len(interviews)}

    scores = []
    for i in completed:
        parts = [i.technical_score, i.communication_score, i.overall_rating]
        parts = [float(p) for p in parts if p is not None]
        if parts:
            scores.append(sum(parts) / len(parts) * 10.0)  # 1-10 -> 0-100

    if not scores:
        return {"score": None, "status": "PENDING",
                "note": "Interview completed but feedback scores missing",
                "interviews_total": len(interviews)}

    return {
        "score": _clamp(sum(scores) / len(scores)),
        "status": "SCORED",
        "interviews_total": len(interviews),
        "formula": f"average of {len(scores)} completed interview feedback score(s) x 10",
    }


# ═══════════════════════════════ OVERALL ═══════════════════════════════

def calculate_overall(
    components: Dict[str, Optional[float]],
    weights: Dict[str, float],
) -> Dict[str, Any]:
    """Weighted sum over AVAILABLE components only. Weights always sum to 100;
    when a component is missing its weight is reported as unused (partial score).
    No division by weight totals - ever."""
    key_map = {
        "ats": ("ats_weight", "ats_score"),
        "coding": ("coding_weight", "coding_score"),
        "skill": ("skill_weight", "skill_match_score"),
        "interview": ("interview_weight", "interview_score"),
    }
    contributions, used_weight, overall = {}, 0.0, 0.0
    for comp, (wk, ck) in key_map.items():
        w = float(weights.get(wk, 0.0))
        score = components.get(ck)
        if score is None:
            contributions[comp] = {"score": None, "weight": w, "contribution": None}
            continue
        contrib = round(score * (w / 100.0), 2)
        contributions[comp] = {"score": round(score, 2), "weight": w, "contribution": contrib}
        overall += contrib
        used_weight += w

    overall = _clamp(overall)
    return {
        "overall_score": overall,
        "contributions": contributions,
        "used_weight": round(used_weight, 2),
        "is_partial": used_weight < 99.999,
    }


def get_match_level(score: float) -> str:
    """Centralized thresholds (spec #24)."""
    if score >= 90: return "Excellent Match"
    if score >= 80: return "Strong Match"
    if score >= 70: return "Potential Match"
    if score >= 60: return "Moderate Match"
    return "Low Match"


def get_recommendation(score: float) -> str:
    if score >= 85: return "Recommended"
    if score >= 70: return "Potential Match"
    if score >= 55: return "Needs Review"
    return "Low Match"


def get_eligibility(ats: Dict, coding: Dict, interview: Dict) -> str:
    """Ranking eligibility per spec #16."""
    if ats["status"] in ("NOT_ATTEMPTED",):
        return "INCOMPLETE" if coding["status"] == "NOT_ATTEMPTED" else "PENDING_ASSESSMENT"
    if coding["status"] in ("NOT_ATTEMPTED", "PENDING"):
        return "PENDING_ASSESSMENT"
    if interview["status"] in ("NOT_ATTEMPTED", "PENDING"):
        return "PENDING_ASSESSMENT"
    return "READY_FOR_RANKING"


# ═══════════════════════════════ FULL EVALUATION ═══════════════════════════════

def evaluate_application(
    db: Session,
    application: Application,
    job: Job,
    weights: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """Full deterministic evaluation of one application for one job."""
    if weights is None:
        weights = _load_raw_weights(db, job.id)
        # legacy decimal migration
        if 0 < sum(weights.values()) <= 1.001:
            weights = {k: round(v * 100.0, 2) for k, v in weights.items()}

    resume = application.resume or (
        db.query(Resume)
        .filter(Resume.user_id == application.candidate_id, Resume.is_parsed == True)  # noqa: E712
        .order_by(Resume.created_at.desc())
        .first()
    )

    ats = compute_ats(db, application, application.candidate_id)
    skill = compute_skill_match(job, resume)
    coding = compute_coding(db, application.candidate_id, job)
    interview = compute_interview(db, job.id, application.candidate_id)

    components = {
        "ats_score": ats["score"],
        "coding_score": coding["score"],
        "skill_match_score": skill["score"],
        "interview_score": interview["score"],
    }
    result = calculate_overall(components, weights)

    eligibility = get_eligibility(ats, coding, interview)
    match_level = get_match_level(result["overall_score"]) if result["overall_score"] is not None else None

    return {
        "candidate_id": str(application.candidate_id),
        "application_id": str(application.id),
        "ats": ats,
        "skill": skill,
        "coding": coding,
        "interview": interview,
        "eligibility": eligibility,
        **result,
        "match_level": match_level,
        "recommendation": get_recommendation(result["overall_score"]) if result["overall_score"] is not None else None,
        "weights_used": {k: round(float(weights.get(k, 0.0)), 2) for k in WEIGHT_KEYS},
        "calculated_at": datetime.utcnow().isoformat(),
    }


def rank_candidates(evaluations: List[Dict[str, Any]], applied_at: Dict[str, datetime]) -> List[Dict[str, Any]]:
    """Deterministic sort: overall DESC, then skill, coding, interview, ats DESC,
    then earliest application first. Assigns rank #1..N."""
    def sort_key(ev):
        cid = ev["candidate_id"]
        applied = applied_at.get(cid)
        applied_ord = applied.timestamp() if applied else float("inf")
        return (
            -(ev["overall_score"] or 0.0),
            -(ev["skill"]["score"] if ev["skill"]["score"] is not None else 0.0),
            -(ev["coding"]["score"] if ev["coding"]["score"] is not None else 0.0),
            -(ev["interview"]["score"] if ev["interview"]["score"] is not None else 0.0),
            -(ev["ats"]["score"] if ev["ats"]["score"] is not None else 0.0),
            applied_ord,
        )

    ranked = sorted(evaluations, key=sort_key)
    for i, ev in enumerate(ranked):
        ev["rank"] = i + 1
    return ranked


def summarize(evaluations: List[Dict[str, Any]], weights: Dict[str, float], job_id: Any) -> Dict[str, Any]:
    """Aggregate stats per spec #40."""
    ranked = [e for e in evaluations if e["eligibility"] == "READY_FOR_RANKING"]
    pending = [e for e in evaluations if e["eligibility"] != "READY_FOR_RANKING"]

    def avg(values: List[float]) -> Optional[float]:
        vals = [v for v in values if v is not None]
        return round(sum(vals) / len(vals), 1) if vals else None

    return {
        "job_id": str(job_id),
        "total_applicants": len(evaluations),
        "ranked_candidates": len(ranked),
        "pending_candidates": len(pending),
        "average_ats": avg([e["ats"]["score"] for e in ranked]),
        "average_coding": avg([e["coding"]["score"] for e in ranked]),
        "average_skill": avg([e["skill"]["score"] for e in ranked]),
        "average_interview": avg([e["interview"]["score"] for e in ranked]),
        "average_overall": avg([e["overall_score"] for e in ranked]),
        "weights": {k: round(float(weights.get(k, 0.0)), 2) for k in WEIGHT_KEYS},
    }