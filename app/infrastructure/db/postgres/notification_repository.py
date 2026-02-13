"""Postgres notification repository implementation."""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import and_, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.notification import Notification
from app.infrastructure.db.mappers import (notification_entity_to_model,
                                           notification_model_to_entity)
from app.infrastructure.db.models import NotificationModel
from app.interfaces.repositories.notification_repository import \
    INotificationRepository


class PostgresNotificationRepository(INotificationRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, notification: Notification) -> Notification:
        model = notification_entity_to_model(notification)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return notification_model_to_entity(model)

    async def get_by_id(self, notification_id: uuid.UUID) -> Optional[Notification]:
        result = await self._session.execute(
            select(NotificationModel).where(NotificationModel.id == notification_id)
        )
        model = result.scalar_one_or_none()
        return notification_model_to_entity(model) if model else None

    async def get_user_notifications(
        self,
        user_id: uuid.UUID,
        unread_only: bool = False,
        offset: int = 0,
        limit: int = 20,
    ) -> list[Notification]:
        stmt = select(NotificationModel).where(NotificationModel.user_id == user_id)
        if unread_only:
            stmt = stmt.where(NotificationModel.is_read == False)  # noqa: E712
        stmt = stmt.order_by(NotificationModel.created_at.desc()).offset(offset).limit(limit)
        result = await self._session.execute(stmt)
        return [notification_model_to_entity(m) for m in result.scalars().all()]

    async def mark_as_read(self, notification_id: uuid.UUID) -> None:
        await self._session.execute(
            update(NotificationModel)
            .where(NotificationModel.id == notification_id)
            .values(is_read=True)
        )
        await self._session.flush()

    async def mark_all_as_read(self, user_id: uuid.UUID) -> None:
        await self._session.execute(
            update(NotificationModel)
            .where(
                and_(
                    NotificationModel.user_id == user_id,
                    NotificationModel.is_read == False,  # noqa: E712
                )
            )
            .values(is_read=True)
        )
        await self._session.flush()

    async def count_unread(self, user_id: uuid.UUID) -> int:
        result = await self._session.execute(
            select(func.count()).where(
                and_(
                    NotificationModel.user_id == user_id,
                    NotificationModel.is_read == False,  # noqa: E712
                )
            )
        )
        return result.scalar() or 0
