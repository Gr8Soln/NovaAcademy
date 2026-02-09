"""Postgres quiz repository implementation."""

from __future__ import annotations

import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.entities.quiz import Quiz
from app.infrastructure.db.mappers import quiz_entity_to_model, quiz_model_to_entity
from app.infrastructure.db.models import QuizModel
from app.interfaces.repositories.quiz_repository import IQuizRepository


class PostgresQuizRepository(IQuizRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, quiz: Quiz) -> Quiz:
        model = quiz_entity_to_model(quiz)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model, attribute_names=["questions"])
        return quiz_model_to_entity(model)

    async def get_by_id(self, quiz_id: uuid.UUID) -> Optional[Quiz]:
        result = await self._session.execute(
            select(QuizModel).options(selectinload(QuizModel.questions)).where(QuizModel.id == quiz_id)
        )
        model = result.scalar_one_or_none()
        return quiz_model_to_entity(model) if model else None

    async def list_by_user(self, user_id: uuid.UUID, offset: int = 0, limit: int = 20) -> List[Quiz]:
        result = await self._session.execute(
            select(QuizModel)
            .options(selectinload(QuizModel.questions))
            .where(QuizModel.user_id == user_id)
            .order_by(QuizModel.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return [quiz_model_to_entity(m) for m in result.scalars().all()]

    async def list_by_document(self, document_id: uuid.UUID) -> List[Quiz]:
        result = await self._session.execute(
            select(QuizModel)
            .options(selectinload(QuizModel.questions))
            .where(QuizModel.document_id == document_id)
            .order_by(QuizModel.created_at.desc())
        )
        return [quiz_model_to_entity(m) for m in result.scalars().all()]

    async def delete(self, quiz_id: uuid.UUID) -> None:
        result = await self._session.execute(select(QuizModel).where(QuizModel.id == quiz_id))
        model = result.scalar_one_or_none()
        if model:
            await self._session.delete(model)
            await self._session.flush()
