from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities import ChatMessage


class IChatNotificationInterface(ABC):    
    @abstractmethod
    async def notify_mention(
        self,
        mentioned_user_id: UUID,
        message: ChatMessage,
        group_name: str,
    ) -> None:
        """Notify a user they were mentioned."""
        ...
    
    @abstractmethod
    async def notify_new_message(
        self,
        user_ids: list[UUID],
        message: ChatMessage,
        group_name: str,
    ) -> None:
        """Notify users of a new message (if they have notifications enabled)."""
        ...