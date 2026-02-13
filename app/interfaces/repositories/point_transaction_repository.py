"""Abstract point transaction repository interface."""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional

from app.domain.entities.point_transaction import PointAction, PointTransaction


class IPointTransactionRepository(ABC):

    @abstractmethod
    async def create(self, transaction: PointTransaction) -> PointTransaction:
        ...

    @abstractmethod
    async def get_balance(self, user_id: uuid.UUID) -> int:
        """Sum of all point transactions for a user."""
        ...

    @abstractmethod
    async def get_history(
        self, user_id: uuid.UUID, offset: int = 0, limit: int = 20
    ) -> list[PointTransaction]:
        ...

    @abstractmethod
    async def count_action_today(self, user_id: uuid.UUID, action: PointAction) -> int:
        """Count how many times a specific action occurred today for anti-gaming."""
        ...

    @abstractmethod
    async def get_points_since(self, user_id: uuid.UUID, since: datetime) -> int:
        """Sum of points earned since a given time (for rolling leaderboard windows)."""
        ...
