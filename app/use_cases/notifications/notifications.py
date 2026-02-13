"""Notification use cases — list, mark read."""

from __future__ import annotations

import uuid

from app.domain.entities.notification import Notification
from app.domain.exceptions import NotificationNotFoundError
from app.interfaces.repositories.notification_repository import \
    INotificationRepository


class GetNotificationsUseCase:
    def __init__(self, notification_repo: INotificationRepository) -> None:
        self._repo = notification_repo

    async def execute(
        self, user_id: uuid.UUID, unread_only: bool = False, offset: int = 0, limit: int = 20
    ) -> list[Notification]:
        return await self._repo.get_user_notifications(user_id, unread_only=unread_only, offset=offset, limit=limit)


class MarkNotificationReadUseCase:
    def __init__(self, notification_repo: INotificationRepository) -> None:
        self._repo = notification_repo

    async def execute(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> None:
        n = await self._repo.get_by_id(notification_id)
        if not n or n.user_id != user_id:
            raise NotificationNotFoundError("Notification not found")
        await self._repo.mark_as_read(notification_id)


class MarkAllNotificationsReadUseCase:
    def __init__(self, notification_repo: INotificationRepository) -> None:
        self._repo = notification_repo

    async def execute(self, user_id: uuid.UUID) -> None:
        await self._repo.mark_all_as_read(user_id)


class GetUnreadCountUseCase:
    def __init__(self, notification_repo: INotificationRepository) -> None:
        self._repo = notification_repo

    async def execute(self, user_id: uuid.UUID) -> int:
        return await self._repo.count_unread(user_id)
