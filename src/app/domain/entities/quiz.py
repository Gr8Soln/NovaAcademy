"""Quiz domain entities — generated quizzes and questions."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"
    FLASHCARD = "flashcard"


class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


@dataclass
class QuizQuestion:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    quiz_id: uuid.UUID = field(default_factory=uuid.uuid4)
    question_text: str = ""
    question_type: QuestionType = QuestionType.MULTIPLE_CHOICE
    options: List[str] = field(default_factory=list)  # For MCQ
    correct_answer: str = ""
    explanation: str = ""
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    source_chunk_ids: List[str] = field(default_factory=list)
    order: int = 0


@dataclass
class Quiz:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    user_id: uuid.UUID = field(default_factory=uuid.uuid4)
    document_id: uuid.UUID = field(default_factory=uuid.uuid4)
    title: str = ""
    description: str = ""
    questions: List[QuizQuestion] = field(default_factory=list)
    total_questions: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)

    # ── Business rules ──────────────────────────────────────────

    def add_question(self, question: QuizQuestion) -> None:
        question.quiz_id = self.id
        question.order = len(self.questions)
        self.questions.append(question)
        self.total_questions = len(self.questions)

    def score(self, answers: dict[uuid.UUID, str]) -> tuple[int, int]:
        """Return (correct_count, total) given {question_id: user_answer}."""
        correct = 0
        for q in self.questions:
            user_answer = answers.get(q.id)
            if user_answer and user_answer.strip().lower() == q.correct_answer.strip().lower():
                correct += 1
        return correct, self.total_questions
