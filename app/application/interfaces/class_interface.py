# src/application/ports/chat_ports.py

from abc import ABC, abstractmethod
from uuid import UUID
from datetime import datetime
from typing import Optional

from ...domain.entities import Message
from ...domain.entities import Group, GroupMember


# =============================================================================
# REPOSITORY PORTS
# =============================================================================

class IMessageInterface(ABC):
    """
    Message persistence interface.
    
    WHY abstract:
    - Use cases depend on this interface
    - Can swap between PostgreSQL, MongoDB, Redis for different needs
    - Easy to mock in tests
    """
    
    @abstractmethod
    async def save(self, message: Message) -> Message:
        """Save a message."""
        ...
    
    @abstractmethod
    async def get_by_id(self, message_id: UUID) -> Optional[Message]:
        """Get a message by ID."""
        ...
    
    @abstractmethod
    async def get_group_messages(
        self,
        group_id: UUID,
        limit: int = 50,
        before: Optional[datetime] = None,
    ) -> list[Message]:
        """
        Get messages for a group (paginated).
        
        Args:
            group_id: The group to fetch messages from
            limit: Max number of messages to return
            before: Get messages before this timestamp (for pagination)
        """
        ...
    
    @abstractmethod
    async def get_messages_by_ids(self, message_ids: list[UUID]) -> list[Message]:
        """Get multiple messages by their IDs."""
        ...
    
    @abstractmethod
    async def search_messages(
        self,
        group_id: UUID,
        query: str,
        limit: int = 20,
    ) -> list[Message]:
        """Search messages by content."""
        ...
    
    @abstractmethod
    async def get_messages_with_mentions(
        self,
        user_id: UUID,
        limit: int = 50,
    ) -> list[Message]:
        """Get all messages where a user was mentioned."""
        ...
    
    @abstractmethod
    async def delete(self, message_id: UUID) -> bool:
        """Delete a message."""
        ...


class IGroupInterface(ABC):
    """Group persistence interface."""
    
    @abstractmethod
    async def save(self, group: Group) -> Group:
        """Save or update a group."""
        ...
    
    @abstractmethod
    async def get_by_id(self, group_id: UUID) -> Optional[Group]:
        """Get a group by ID."""
        ...
    
    @abstractmethod
    async def get_user_groups(self, user_id: UUID) -> list[Group]:
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


# =============================================================================
# REAL-TIME COMMUNICATION PORTS
# =============================================================================

class IChatPubSub(ABC):
    """
    Pub/Sub interface for real-time message broadcasting.
    
    WHY this exists:
    - Enables horizontal scaling (multiple FastAPI instances)
    - Use cases don't care if it's Redis, RabbitMQ, or Kafka
    - Can implement locally for development (in-memory)
    
    PATTERN:
    - Publisher: Use case publishes message to channel
    - Subscribers: WebSocket managers subscribe to channels
    - Redis Pub/Sub relays messages between instances
    """
    
    @abstractmethod
    async def publish_message(self, group_id: UUID, message: Message) -> None:
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


class IPresenceService(ABC):
    """
    User presence tracking (online/offline).
    
    WHY separate from repositories:
    - Different data lifetime (ephemeral vs persistent)
    - Different storage strategy (Redis with TTL)
    - Different access patterns (frequent reads/writes)
    """
    
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


class ICacheService(ABC):
    """
    Caching interface for frequently accessed data.
    
    WHY cache:
    - Group metadata (names, member lists) accessed on every message
    - Reduce database load
    - Faster response times
    """
    
    @abstractmethod
    async def get_group(self, group_id: UUID) -> Optional[Group]:
        """Get cached group."""
        ...
    
    @abstractmethod
    async def set_group(self, group: Group, ttl: int = 3600) -> None:
        """Cache a group (default TTL: 1 hour)."""
        ...
    
    @abstractmethod
    async def invalidate_group(self, group_id: UUID) -> None:
        """Invalidate cached group."""
        ...
    
    @abstractmethod
    async def get_message(self, message_id: UUID) -> Optional[Message]:
        """Get cached message."""
        ...
    
    @abstractmethod
    async def set_message(self, message: Message, ttl: int = 300) -> None:
        """Cache a message (default TTL: 5 minutes)."""
        ...


# =============================================================================
# NOTIFICATION PORT
# =============================================================================

class INotificationService(ABC):
    """
    Notification interface for mentions, new messages, etc.
    
    WHY separate:
    - Notifications can be push notifications, emails, SMS, etc.
    - Use cases don't care about delivery mechanism
    - Can be async/background task
    """
    
    @abstractmethod
    async def notify_mention(
        self,
        mentioned_user_id: UUID,
        message: Message,
        group_name: str,
    ) -> None:
        """Notify a user they were mentioned."""
        ...
    
    @abstractmethod
    async def notify_new_message(
        self,
        user_ids: list[UUID],
        message: Message,
        group_name: str,
    ) -> None:
        """Notify users of a new message (if they have notifications enabled)."""
        ...