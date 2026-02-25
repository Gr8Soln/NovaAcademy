import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.interfaces.study_session_interface import IStudySessionInterface
from app.domain.entities.study_session_entity import StudySession
from app.infrastructure.db.models.study_session_model import StudySessionModel


class SQLStudySessionRepository(IStudySessionInterface):
    """PostgreSQL implementation of the study session repository."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, session: StudySession) -> StudySession:
        model = StudySessionModel(
            id=session.id,
            user_id=session.user_id,
            document_id=session.document_id,
            class_id=session.class_id,
            start_time=session.start_time,
            last_heartbeat=session.last_heartbeat,
            duration_seconds=session.duration_seconds,
            is_active=session.is_active,
        )
        self._session.add(model)
        await self._session.commit()
        return session

    async def get_by_id(self, session_id: uuid.UUID) -> Optional[StudySession]:
        result = await self._session.execute(
            select(StudySessionModel).where(StudySessionModel.id == session_id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_active_by_user(self, user_id: uuid.UUID) -> Optional[StudySession]:
        result = await self._session.execute(
            select(StudySessionModel).where(
                and_(
                    StudySessionModel.user_id == user_id,
                    StudySessionModel.is_active == True
                )
            ).order_by(StudySessionModel.last_heartbeat.desc())
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def update(self, session: StudySession) -> StudySession:
        result = await self._session.execute(
            select(StudySessionModel).where(StudySessionModel.id == session.id)
        )
        model = result.scalar_one_or_none()
        if model:
            model.last_heartbeat = session.last_heartbeat
            model.end_time = session.end_time
            model.duration_seconds = session.duration_seconds
            model.is_active = session.is_active
            await self._session.commit()
        return session

    async def list_by_user(
        self, 
        user_id: uuid.UUID, 
        class_id: Optional[uuid.UUID] = None,
        limit: int = 50
    ) -> List[StudySession]:
        q = select(StudySessionModel).where(StudySessionModel.user_id == user_id)
        if class_id:
            q = q.where(StudySessionModel.class_id == class_id)
        
        q = q.order_by(StudySessionModel.start_time.desc()).limit(limit)
        result = await self._session.execute(q)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def get_total_duration(
        self, 
        user_id: uuid.UUID, 
        class_id: Optional[uuid.UUID] = None
    ) -> int:
        q = select(func.sum(StudySessionModel.duration_seconds)).where(
            StudySessionModel.user_id == user_id
        )
        if class_id:
            q = q.where(StudySessionModel.class_id == class_id)
            
        result = await self._session.execute(q)
        return result.scalar() or 0

    @staticmethod
    def _to_entity(model: StudySessionModel) -> StudySession:
        return StudySession(
            id=model.id,
            user_id=model.user_id,
            document_id=model.document_id,
            class_id=model.class_id,
            start_time=model.start_time,
            end_time=model.end_time,
            last_heartbeat=model.last_heartbeat,
            duration_seconds=model.duration_seconds,
            is_active=model.is_active,
        )
