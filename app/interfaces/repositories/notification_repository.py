"""Abstract notification repository interface."""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from typing import Optional

from app.domain.entities.notification import Notification


class INotificationRepository(ABC):

    @abstractmethod
    async def create(self, notification: Notification) -> Notification:
        ...

    @abstractmethod
    async def get_by_id(self, notification_id: uuid.UUID) -> Optional[Notification]:
        ...

    @abstractmethod
    async def get_user_notifications(
        self, user_id: uuid.UUID, unread_only: bool = False, offset: int = 0, limit: int = 20
    ) -> list[Notification]:
        ...

    @abstractmethod
    async def mark_as_read(self, notification_id: uuid.UUID) -> None:
        ...

    @abstractmethod
    async def mark_all_as_read(self, user_id: uuid.UUID) -> None:
        ...

    @abstractmethod
    async def count_unread(self, user_id: uuid.UUID) -> int:
        ...
