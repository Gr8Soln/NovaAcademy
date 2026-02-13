"""Dashboard / student progress schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel


class ProgressResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    document_id: uuid.UUID
    topic_mastery: Dict[str, float]
    quizzes_taken: int
    questions_answered: int
    correct_answers: int
    accuracy: float
    total_study_time_seconds: int
    last_study_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DashboardResponse(BaseModel):
    total_documents: int
    total_quizzes_taken: int
    overall_accuracy: float
    total_study_time_seconds: int
    recent_documents: list  # simplified for now
    progress_records: List[ProgressResponse]
