import uuid
from abc import ABC, abstractmethod

from app.domain.entities.notification import Notification


class INotificationPushService(ABC):
    """Push notifications to connected clients (SSE / WebSocket / etc.)."""

    @abstractmethod
    async def push(self, notification: Notification) -> None:
        """Push a notification to the target user."""
        ...

    @abstractmethod
    async def subscribe(self, user_id: uuid.UUID):
        """Return an async iterator of notifications for SSE streaming."""
        ...
