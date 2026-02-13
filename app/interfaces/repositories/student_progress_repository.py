"""Abstract student progress repository interface."""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.entities.student_progress import StudentProgress


class IStudentProgressRepository(ABC):

    @abstractmethod
    async def create(self, progress: StudentProgress) -> StudentProgress:
        ...

    @abstractmethod
    async def get_by_user_and_document(
        self, user_id: uuid.UUID, document_id: uuid.UUID
    ) -> Optional[StudentProgress]:
        ...

    @abstractmethod
    async def list_by_user(self, user_id: uuid.UUID) -> List[StudentProgress]:
        ...

    @abstractmethod
    async def update(self, progress: StudentProgress) -> StudentProgress:
        ...
