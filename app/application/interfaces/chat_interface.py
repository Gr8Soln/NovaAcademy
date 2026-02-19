from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional
from uuid import UUID

from app.domain.entities import ChatGroup, ChatMessage


class IChatMessageInterface(ABC):    
    @abstractmethod
    async def save(self, message: ChatMessage) -> ChatMessage:
        """Save a message."""
        ...
    
    @abstractmethod
    async def get_by_id(self, message_id: UUID) -> Optional[ChatMessage]:
        """Get a message by ID."""
        ...
    
    @abstractmethod
    async def get_group_messages(
        self,
        group_id: UUID,
        limit: int = 50,
        before: Optional[datetime] = None,
    ) -> list[ChatMessage]:
        """
        Get messages for a group (paginated).
        
        Args:
            group_id: The group to fetch messages from
            limit: Max number of messages to return
            before: Get messages before this timestamp (for pagination)
        """
        ...
    
    @abstractmethod
    async def get_messages_by_ids(self, message_ids: list[UUID]) -> list[ChatMessage]:
        """Get multiple messages by their IDs."""
        ...
    
    @abstractmethod
    async def search_messages(
        self,
        group_id: UUID,
        query: str,
        limit: int = 20,
    ) -> list[ChatMessage]:
        """Search messages by content."""
        ...
    
    @abstractmethod
    async def get_messages_with_mentions(
        self,
        user_id: UUID,
        limit: int = 50,
    ) -> list[ChatMessage]:
        """Get all messages where a user was mentioned."""
        ...
    
    @abstractmethod
    async def delete(self, message_id: UUID) -> bool:
        """Delete a message."""
        ...


class IChatGroupInterface(ABC):    
    @abstractmethod
    async def save(self, group: ChatGroup) -> ChatGroup:
        """Save or update a group."""
        ...
    
    @abstractmethod
    async def get_by_id(self, group_id: UUID) -> Optional[ChatGroup]:
        """Get a group by ID."""
        ...
    
    @abstractmethod
    async def get_user_groups(self, user_id: UUID) -> list[ChatGroup]:
        """Get all groups a user is a member of."""
        ...
    
    @abstractmethod
    async def delete(self, group_id: UUID) -> bool:
        """Delete a group."""
        ...
    
    @abstractmethod
    async def is_member(self, group_id: UUID, user_id: UUID) -> bool:
        """Check if a user is a member of a group."""
        ...


class IChatPubSub(ABC):    
    @abstractmethod
    async def publish_message(self, group_id: UUID, message: ChatMessage) -> None:
        """
        Publish a new message to all subscribers of a group.
        
        This will be received by ALL FastAPI instances.
        Each instance broadcasts to its connected WebSocket clients.
        """
        ...
    
    @abstractmethod
    async def publish_typing_indicator(
        self, 
        group_id: UUID, 
        user_id: UUID, 
        username: str,
        is_typing: bool
    ) -> None:
        """Publish typing indicator."""
        ...
    
    @abstractmethod
    async def publish_user_joined(self, group_id: UUID, user_id: UUID, username: str) -> None:
        """Publish user joined event."""
        ...
    
    @abstractmethod
    async def publish_user_left(self, group_id: UUID, user_id: UUID, username: str) -> None:
        """Publish user left event."""
        ...
    
    @abstractmethod
    async def subscribe_to_group(self, group_id: UUID, callback) -> None:
        """
        Subscribe to a group's channel.
        
        callback: async function that receives published messages
        """
        ...
    
    @abstractmethod
    async def unsubscribe_from_group(self, group_id: UUID) -> None:
        """Unsubscribe from a group's channel."""
        ...


class IChatPresenceService(ABC):
    @abstractmethod
    async def set_user_online(self, user_id: UUID, group_id: UUID) -> None:
        """Mark user as online in a group."""
        ...
    
    @abstractmethod
    async def set_user_offline(self, user_id: UUID, group_id: UUID) -> None:
        """Mark user as offline in a group."""
        ...
    
    @abstractmethod
    async def get_online_users(self, group_id: UUID) -> list[UUID]:
        """Get list of online users in a group."""
        ...
    
    @abstractmethod
    async def is_user_online(self, user_id: UUID, group_id: UUID) -> bool:
        """Check if a user is online in a group."""
        ...


class IChatCacheInterface(ABC):
    @abstractmethod
    async def get_group(self, group_id: UUID) -> Optional[ChatGroup]:
        """Get cached group."""
        ...
    
    @abstractmethod
    async def set_group(self, group: ChatGroup, ttl: int = 3600) -> None:
        """Cache a group (default TTL: 1 hour)."""
        ...
    
    @abstractmethod
    async def invalidate_group(self, group_id: UUID) -> None:
        """Invalidate cached group."""
        ...
    
    @abstractmethod
    async def get_message(self, message_id: UUID) -> Optional[ChatMessage]:
        """Get cached message."""
        ...
    
    @abstractmethod
    async def set_message(self, message: ChatMessage, ttl: int = 300) -> None:
        """Cache a message (default TTL: 5 minutes)."""
        ...
        
    # ====== Notification caching (optional) ==============================
    
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