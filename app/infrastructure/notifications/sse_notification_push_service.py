"""SSE-based notification push service — in-memory pub/sub for realtime notifications."""

from __future__ import annotations

import asyncio
import uuid
from collections import defaultdict
from typing import AsyncIterator

from app.domain.entities.notification import Notification
from app.interfaces.services.notification_push_service import \
    INotificationPushService


class SSENotificationPushService(INotificationPushService):
    """In-process pub/sub using asyncio.Queue per connected user.

    For multi-process / horizontal scaling, swap this for Redis Pub/Sub or
    similar — the interface stays the same.
    """

    def __init__(self) -> None:
        # user_id -> set of asyncio.Queue
        self._subscribers: dict[uuid.UUID, set[asyncio.Queue]] = defaultdict(set)

    async def push(self, notification: Notification) -> None:
        """Push a notification to all subscribers for the target user."""
        queues = self._subscribers.get(notification.user_id, set())
        dead: list[asyncio.Queue] = []
        for q in queues:
            try:
                q.put_nowait(notification)
            except asyncio.QueueFull:
                dead.append(q)
        # Clean up dead queues
        for q in dead:
            queues.discard(q)

    async def subscribe(self, user_id: uuid.UUID) -> AsyncIterator[Notification]:
        """Yield notifications as they arrive — used by SSE endpoint."""
        q: asyncio.Queue[Notification] = asyncio.Queue(maxsize=64)
        self._subscribers[user_id].add(q)
        try:
            while True:
                notification = await q.get()
                yield notification
        finally:
            self._subscribers[user_id].discard(q)
            if not self._subscribers[user_id]:
                del self._subscribers[user_id]
