"""Abstract post repository interface."""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from typing import Optional

from app.domain.entities.post import Post, PostLike


class IPostRepository(ABC):

    @abstractmethod
    async def create(self, post: Post) -> Post:
        ...

    @abstractmethod
    async def get_by_id(self, post_id: uuid.UUID) -> Optional[Post]:
        ...

    @abstractmethod
    async def delete(self, post_id: uuid.UUID) -> None:
        ...

    @abstractmethod
    async def get_feed(self, following_ids: list[uuid.UUID], offset: int = 0, limit: int = 20) -> list[Post]:
        """Posts from users the current user follows, newest first."""
        ...

    @abstractmethod
    async def get_explore(self, offset: int = 0, limit: int = 20) -> list[Post]:
        """Recent / trending posts from everyone."""
        ...

    @abstractmethod
    async def get_user_posts(self, user_id: uuid.UUID, offset: int = 0, limit: int = 20) -> list[Post]:
        ...

    @abstractmethod
    async def increment_impressions(self, post_id: uuid.UUID) -> None:
        ...

    # ── Likes ───────────────────────────────────────────────────

    @abstractmethod
    async def add_like(self, like: PostLike) -> PostLike:
        ...

    @abstractmethod
    async def remove_like(self, post_id: uuid.UUID, user_id: uuid.UUID) -> None:
        ...

    @abstractmethod
    async def get_like(self, post_id: uuid.UUID, user_id: uuid.UUID) -> Optional[PostLike]:
        ...

    @abstractmethod
    async def count_user_posts(self, user_id: uuid.UUID) -> int:
        ...

    @abstractmethod
    async def count_feed(self, following_ids: list[uuid.UUID]) -> int:
        """Count posts from followed users."""
        ...

    @abstractmethod
    async def count_explore(self) -> int:
        """Count all posts."""
        ...
