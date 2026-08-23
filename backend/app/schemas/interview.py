"""
Pydantic Schemas for AI Mock Interview Module.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID


class ExpectedPointSchema(BaseModel):
    id: int
    point: str
    weight: float = 1.0


class PointEvaluationResult(BaseModel):
    expected_point: str
    matched: bool
    confidence: float
    evidence_text: Optional[str] = None


class MockInterviewStartRequest(BaseModel):
    job_id: Optional[UUID] = None
    role_title: Optional[str] = "Software Engineer"
    interview_type: Optional[str] = "Technical"  # Technical, HR, Behavioral, Mixed
    num_questions: Optional[int] = 5


class QuestionAnalyzeRequest(BaseModel):
    question_id: UUID
    transcript: str
    duration_seconds: Optional[int] = 0


class QuestionResponseSubmitRequest(BaseModel):
    question_id: UUID
    transcript: str
    duration_seconds: Optional[int] = 0


class MockInterviewQuestionSchema(BaseModel):
    id: UUID
    interview_id: UUID
    question_number: int
    question_text: str
    question_type: str
    category: str
    difficulty: str
    expected_points: List[Dict[str, Any]]

    class Config:
        from_attributes = True


class MockInterviewResponseItemSchema(BaseModel):
    id: UUID
    question_id: UUID
    transcript: str
    duration_seconds: int
    answer_score: float
    coverage_score: float
    semantic_score: float
    filler_words_count: int
    point_results: List[Dict[str, Any]]
    response_status: str

    class Config:
        from_attributes = True


class MockInterviewStateSchema(BaseModel):
    id: UUID
    candidate_id: UUID
    job_id: Optional[UUID] = None
    role_title: str
    interview_type: str
    status: str
    total_questions: int
    completed_questions: int
    final_score: Optional[float] = None
    technical_score: Optional[float] = None
    coverage_score: Optional[float] = None
    relevance_score: Optional[float] = None
    communication_score: Optional[float] = None
    questions: List[MockInterviewQuestionSchema] = []
    responses: List[MockInterviewResponseItemSchema] = []
    started_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AnalysisResponseSchema(BaseModel):
    point_results: List[Dict[str, Any]]
    coverage_score: float
    semantic_score: float
    answer_score: float
    filler_words_count: int
    response_status: str
    communication: Dict[str, Any]


class InterviewReportSchema(BaseModel):
    interview_id: UUID
    candidate_name: str
    role_title: str
    interview_type: str
    final_score: float
    technical_score: float
    coverage_score: float
    relevance_score: float
    communication_score: float
    status: str
    total_questions: int
    completed_questions: int
    strengths: List[str]
    improvements: List[str]
    missing_topics: List[str]
    questions_detail: List[Dict[str, Any]]
    completed_at: Optional[datetime] = None
