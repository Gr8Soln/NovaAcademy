"""Postgres student progress repository implementation."""

from __future__ import annotations

import uuid
from typing import List, Optional

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.student_progress import StudentProgress
from app.infrastructure.db.mappers import progress_entity_to_model, progress_model_to_entity
from app.infrastructure.db.models import StudentProgressModel
from app.interfaces.repositories.student_progress_repository import IStudentProgressRepository


class PostgresStudentProgressRepository(IStudentProgressRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, progress: StudentProgress) -> StudentProgress:
        model = progress_entity_to_model(progress)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return progress_model_to_entity(model)

    async def get_by_user_and_document(
        self, user_id: uuid.UUID, document_id: uuid.UUID
    ) -> Optional[StudentProgress]:
        result = await self._session.execute(
            select(StudentProgressModel).where(
                and_(
                    StudentProgressModel.user_id == user_id,
                    StudentProgressModel.document_id == document_id,
                )
            )
        )
        model = result.scalar_one_or_none()
        return progress_model_to_entity(model) if model else None

    async def list_by_user(self, user_id: uuid.UUID) -> List[StudentProgress]:
        result = await self._session.execute(
            select(StudentProgressModel).where(StudentProgressModel.user_id == user_id)
        )
        return [progress_model_to_entity(m) for m in result.scalars().all()]

    async def update(self, progress: StudentProgress) -> StudentProgress:
        result = await self._session.execute(
            select(StudentProgressModel).where(StudentProgressModel.id == progress.id)
        )
        model = result.scalar_one_or_none()
        if model:
            model.topic_mastery = progress.topic_mastery
            model.quizzes_taken = progress.quizzes_taken
            model.questions_answered = progress.questions_answered
            model.correct_answers = progress.correct_answers
            model.total_study_time_seconds = progress.total_study_time_seconds
            model.last_study_at = progress.last_study_at
            model.updated_at = progress.updated_at
            await self._session.flush()
            await self._session.refresh(model)
            return progress_model_to_entity(model)
        return progress
