from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.study_session_entity import StudySession


class IStudySessionInterface(ABC):
    """Persistence interface for tracking study sessions."""

    @abstractmethod
    async def create(self, session: StudySession) -> StudySession:
        """Persist a new study session."""
        ...

    @abstractmethod
    async def get_by_id(self, session_id: UUID) -> Optional[StudySession]:
        """Retrieve a session by its ID."""
        ...

    @abstractmethod
    async def get_active_by_user(self, user_id: UUID) -> Optional[StudySession]:
        """Retrieve the current active session for a user, if any."""
        ...

    @abstractmethod
    async def update(self, session: StudySession) -> StudySession:
        """Update an existing session (heartbeat, duration, end)."""
        ...

    @abstractmethod
    async def list_by_user(
        self, 
        user_id: UUID, 
        class_id: Optional[UUID] = None,
        limit: int = 50
    ) -> List[StudySession]:
        """Retrieve session history for a user, optionally filtered by class."""
        ...

    @abstractmethod
    async def get_total_duration(
        self, 
        user_id: UUID, 
        class_id: Optional[UUID] = None
    ) -> int:
        """Calculate total study seconds for a user (overall or per class)."""
        ...
