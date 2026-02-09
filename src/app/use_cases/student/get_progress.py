"""Get student progress for a specific document."""

from __future__ import annotations

import uuid

from app.domain.entities.student_progress import StudentProgress
from app.interfaces.repositories.student_progress_repository import IStudentProgressRepository


class GetProgressUseCase:
    def __init__(self, progress_repo: IStudentProgressRepository) -> None:
        self._progress_repo = progress_repo

    async def execute(self, user_id: uuid.UUID, document_id: uuid.UUID) -> StudentProgress:
        progress = await self._progress_repo.get_by_user_and_document(user_id, document_id)
        if not progress:
            progress = StudentProgress(user_id=user_id, document_id=document_id)
            progress = await self._progress_repo.create(progress)
        return progress
