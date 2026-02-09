"""Abstract cache service interface (Redis or in-memory)."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional


class ICacheService(ABC):

    @abstractmethod
    async def get(self, key: str) -> Optional[str]:
        ...

    @abstractmethod
    async def set(self, key: str, value: str, ttl_seconds: int | None = None) -> None:
        ...

    @abstractmethod
    async def delete(self, key: str) -> None:
        ...

    @abstractmethod
    async def exists(self, key: str) -> bool:
        ...
