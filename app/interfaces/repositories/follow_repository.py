"""Abstract follow repository interface."""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from typing import Optional

from app.domain.entities.follow import Follow


class IFollowRepository(ABC):

    @abstractmethod
    async def create(self, follow: Follow) -> Follow:
        ...

    @abstractmethod
    async def delete(self, follower_id: uuid.UUID, following_id: uuid.UUID) -> None:
        ...

    @abstractmethod
    async def get(self, follower_id: uuid.UUID, following_id: uuid.UUID) -> Optional[Follow]:
        ...

    @abstractmethod
    async def get_followers(self, user_id: uuid.UUID, offset: int = 0, limit: int = 20) -> list[Follow]:
        ...

    @abstractmethod
    async def get_following(self, user_id: uuid.UUID, offset: int = 0, limit: int = 20) -> list[Follow]:
        ...

    @abstractmethod
    async def count_followers(self, user_id: uuid.UUID) -> int:
        ...

    @abstractmethod
    async def count_following(self, user_id: uuid.UUID) -> int:
        ...

    @abstractmethod
    async def is_mutual(self, user_a: uuid.UUID, user_b: uuid.UUID) -> bool:
        """Check if both users follow each other (study buddies)."""
        ...
