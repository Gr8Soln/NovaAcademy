"""Abstract user repository interface."""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from typing import Optional

from app.domain.entities.user import User


class IUserRepository(ABC):

    @abstractmethod
    async def create(self, user: User) -> User:
        ...

    @abstractmethod
    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        ...

    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]:
        ...

    @abstractmethod
    async def get_by_google_sub(self, google_sub: str) -> Optional[User]:
        ...

    @abstractmethod
    async def update(self, user: User) -> User:
        ...

    @abstractmethod
    async def delete(self, user_id: uuid.UUID) -> None:
        ...
