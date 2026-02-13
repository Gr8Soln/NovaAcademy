"""Abstract challenge repository interface."""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional

from app.domain.entities.challenge import Challenge


class IChallengeRepository(ABC):

    @abstractmethod
    async def create(self, challenge: Challenge) -> Challenge:
        ...

    @abstractmethod
    async def get_by_id(self, challenge_id: uuid.UUID) -> Optional[Challenge]:
        ...

    @abstractmethod
    async def update(self, challenge: Challenge) -> Challenge:
        ...

    @abstractmethod
    async def get_user_challenges(
        self, user_id: uuid.UUID, status: Optional[str] = None, offset: int = 0, limit: int = 20
    ) -> list[Challenge]:
        """Get challenges where user is challenger or opponent."""
        ...

    @abstractmethod
    async def count_daily_challenges(self, challenger_id: uuid.UUID, opponent_id: uuid.UUID) -> int:
        """Count challenges sent from challenger to opponent today."""
        ...

    @abstractmethod
    async def get_expired_challenges(self) -> list[Challenge]:
        """Get challenges past their expiry that need resolution."""
        ...
