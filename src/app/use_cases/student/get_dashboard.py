"""Get dashboard summary for a student."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import List

from app.domain.entities.document import Document
from app.domain.entities.student_progress import StudentProgress
from app.interfaces.repositories.document_repository import IDocumentRepository
from app.interfaces.repositories.student_progress_repository import IStudentProgressRepository


@dataclass
class DashboardData:
    documents: List[Document]
    progress_records: List[StudentProgress]
    total_documents: int
    total_quizzes_taken: int
    overall_accuracy: float
    total_study_time_seconds: int


class GetDashboardUseCase:
    def __init__(
        self,
        document_repo: IDocumentRepository,
        progress_repo: IStudentProgressRepository,
    ) -> None:
        self._document_repo = document_repo
        self._progress_repo = progress_repo

    async def execute(self, user_id: uuid.UUID) -> DashboardData:
        documents = await self._document_repo.list_by_user(user_id, limit=100)
        progress_records = await self._progress_repo.list_by_user(user_id)

        total_quizzes = sum(p.quizzes_taken for p in progress_records)
        total_correct = sum(p.correct_answers for p in progress_records)
        total_answered = sum(p.questions_answered for p in progress_records)
        total_study_time = sum(p.total_study_time_seconds for p in progress_records)

        return DashboardData(
            documents=documents,
            progress_records=progress_records,
            total_documents=len(documents),
            total_quizzes_taken=total_quizzes,
            overall_accuracy=total_correct / total_answered if total_answered > 0 else 0.0,
            total_study_time_seconds=total_study_time,
        )
