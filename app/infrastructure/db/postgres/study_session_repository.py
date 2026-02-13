"""Postgres study session repository implementation."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.study_session import StudySession
from app.infrastructure.db.mappers import (study_session_entity_to_model,
                                           study_session_model_to_entity)
from app.infrastructure.db.models import StudySessionModel
from app.interfaces.repositories.study_session_repository import \
    IStudySessionRepository


class PostgresStudySessionRepository(IStudySessionRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, study_session: StudySession) -> StudySession:
        model = study_session_entity_to_model(study_session)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return study_session_model_to_entity(model)

    async def get_by_id(self, session_id: uuid.UUID) -> Optional[StudySession]:
        result = await self._session.execute(
            select(StudySessionModel).where(StudySessionModel.id == session_id)
        )
        model = result.scalar_one_or_none()
        return study_session_model_to_entity(model) if model else None

    async def update(self, study_session: StudySession) -> StudySession:
        result = await self._session.execute(
            select(StudySessionModel).where(StudySessionModel.id == study_session.id)
        )
        model = result.scalar_one_or_none()
        if model:
            model.last_heartbeat_at = study_session.last_heartbeat_at
            model.ended_at = study_session.ended_at
            model.duration_seconds = study_session.duration_seconds
            model.is_active = study_session.is_active
            await self._session.flush()
            await self._session.refresh(model)
            return study_session_model_to_entity(model)
        return study_session

    async def get_active_session(self, user_id: uuid.UUID) -> Optional[StudySession]:
        result = await self._session.execute(
            select(StudySessionModel).where(
                and_(
                    StudySessionModel.user_id == user_id,
                    StudySessionModel.is_active == True,  # noqa: E712
                )
            )
        )
        model = result.scalar_one_or_none()
        return study_session_model_to_entity(model) if model else None

    async def get_total_seconds(self, user_id: uuid.UUID) -> int:
        result = await self._session.execute(
            select(func.coalesce(func.sum(StudySessionModel.duration_seconds), 0)).where(
                StudySessionModel.user_id == user_id
            )
        )
        return int(result.scalar() or 0)

    async def get_seconds_since(self, user_id: uuid.UUID, since: datetime) -> int:
        result = await self._session.execute(
            select(func.coalesce(func.sum(StudySessionModel.duration_seconds), 0)).where(
                and_(
                    StudySessionModel.user_id == user_id,
                    StudySessionModel.started_at >= since,
                )
            )
        )
        return int(result.scalar() or 0)

    async def get_user_sessions(
        self, user_id: uuid.UUID, offset: int = 0, limit: int = 20
    ) -> list[StudySession]:
        result = await self._session.execute(
            select(StudySessionModel)
            .where(StudySessionModel.user_id == user_id)
            .order_by(StudySessionModel.started_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return [study_session_model_to_entity(m) for m in result.scalars().all()]
