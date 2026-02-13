"""Student progress domain entity — tracks learning metrics."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Optional


@dataclass
class StudentProgress:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    user_id: uuid.UUID = field(default_factory=uuid.uuid4)
    document_id: uuid.UUID = field(default_factory=uuid.uuid4)

    # Topic mastery: topic_name → mastery score 0.0 – 1.0
    topic_mastery: Dict[str, float] = field(default_factory=dict)

    quizzes_taken: int = 0
    questions_answered: int = 0
    correct_answers: int = 0
    total_study_time_seconds: int = 0
    last_study_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    # ── Business rules ──────────────────────────────────────────

    @property
    def accuracy(self) -> float:
        if self.questions_answered == 0:
            return 0.0
        return self.correct_answers / self.questions_answered

    def record_quiz_result(self, correct: int, total: int) -> None:
        self.quizzes_taken += 1
        self.correct_answers += correct
        self.questions_answered += total
        self.last_study_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def update_topic_mastery(self, topic: str, score: float) -> None:
        self.topic_mastery[topic] = max(0.0, min(1.0, score))
        self.updated_at = datetime.utcnow()

    def add_study_time(self, seconds: int) -> None:
        self.total_study_time_seconds += seconds
        self.last_study_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
