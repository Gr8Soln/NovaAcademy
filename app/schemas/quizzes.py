"""Quiz schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class QuizQuestionResponse(BaseModel):
    id: uuid.UUID
    question_text: str
    question_type: str
    options: List[str]
    correct_answer: str
    explanation: str
    difficulty: str
    order: int

    model_config = {"from_attributes": True}


class QuizResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    document_id: uuid.UUID
    title: str
    description: str
    questions: List[QuizQuestionResponse]
    total_questions: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SubmitQuizRequest(BaseModel):
    answers: dict[uuid.UUID, str]  # question_id → answer


class QuizResultResponse(BaseModel):
    quiz_id: uuid.UUID
    correct: int
    total: int
    accuracy: float
