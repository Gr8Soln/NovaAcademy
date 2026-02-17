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

    @abstractmethod
    async def search(self, query: str, offset: int = 0, limit: int = 20) -> list[User]:
        """Search users by name or email."""
        ...

    @abstractmethod
    async def list_all(self, offset: int = 0, limit: int = 20) -> list[User]:
        """List all active users (for discovery)."""
        ...

    @abstractmethod
    async def count_search(self, query: str) -> int:
        """Count users matching search query."""
        ...

    @abstractmethod
    async def count_all(self) -> int:
        """Count all active users."""
        ...
