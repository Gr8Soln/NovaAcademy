"""Abstract study session repository interface."""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional

from app.domain.entities.study_session import StudySession


class IStudySessionRepository(ABC):

    @abstractmethod
    async def create(self, session: StudySession) -> StudySession:
        ...

    @abstractmethod
    async def get_by_id(self, session_id: uuid.UUID) -> Optional[StudySession]:
        ...

    @abstractmethod
    async def update(self, session: StudySession) -> StudySession:
        ...

    @abstractmethod
    async def get_active_session(self, user_id: uuid.UUID) -> Optional[StudySession]:
        """Get the user's currently active study session, if any."""
        ...

    @abstractmethod
    async def get_total_seconds(self, user_id: uuid.UUID) -> int:
        """Total study time in seconds across all sessions."""
        ...

    @abstractmethod
    async def get_seconds_since(self, user_id: uuid.UUID, since: datetime) -> int:
        """Study time in seconds since a given time (for rolling leaderboard windows)."""
        ...

    @abstractmethod
    async def get_user_sessions(
        self, user_id: uuid.UUID, offset: int = 0, limit: int = 20
    ) -> list[StudySession]:
        ...
