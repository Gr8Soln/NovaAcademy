"""Abstract quiz repository interface."""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.entities.quiz import Quiz


class IQuizRepository(ABC):

    @abstractmethod
    async def create(self, quiz: Quiz) -> Quiz:
        ...

    @abstractmethod
    async def get_by_id(self, quiz_id: uuid.UUID) -> Optional[Quiz]:
        ...

    @abstractmethod
    async def list_by_user(self, user_id: uuid.UUID, offset: int = 0, limit: int = 20) -> List[Quiz]:
        ...

    @abstractmethod
    async def list_by_document(self, document_id: uuid.UUID) -> List[Quiz]:
        ...

    @abstractmethod
    async def delete(self, quiz_id: uuid.UUID) -> None:
        ...
