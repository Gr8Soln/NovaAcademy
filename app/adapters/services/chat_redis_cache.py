import json
from datetime import datetime
from typing import Optional
from uuid import UUID

import redis.asyncio as redis

from app.application.dtos import MessageType
from app.application.interfaces import IChatCacheInterface
from app.domain.entities import (ChatGroup, ChatGroupMember, ChatGroupRole,
                                 ChatMemberMention, ChatMessage)


class RedisCacheService(IChatCacheInterface):    
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self._redis: redis.Redis
    
    async def connect(self):
        """Initialize Redis connection."""
        self._redis = await redis.from_url(
            self.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    
    async def disconnect(self):
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
    
    # =========================================================================
    # GROUP CACHING
    # =========================================================================
    
    async def get_group(self, group_id: UUID) -> Optional[ChatGroup]:
        """Get cached group."""
        key = self._get_group_key(group_id)
        data = await self._redis.get(key)
        
        if not data:
            return None
        
        return self._deserialize_group(json.loads(data))
    
    async def set_group(self, group: ChatGroup, ttl: int = 3600) -> None:
        """Cache a group."""
        key = self._get_group_key(group.id)
        data = self._serialize_group(group)
        
        await self._redis.setex(
            key,
            ttl,
            json.dumps(data)
        )
    
    async def invalidate_group(self, group_id: UUID) -> None:
        """Invalidate cached group."""
        key = self._get_group_key(group_id)
        await self._redis.delete(key)
    
    # =========================================================================
    # MESSAGE CACHING
    # =========================================================================
    
    async def get_message(self, message_id: UUID) -> Optional[ChatMessage]:
        """Get cached message."""
        key = self._get_message_key(message_id)
        data = await self._redis.get(key)
        
        if not data:
            return None
        
        return self._deserialize_message(json.loads(data))
    
    async def set_message(self, message: ChatMessage, ttl: int = 300) -> None:
        """Cache a message."""
        key = self._get_message_key(message.id)
        data = self._serialize_message(message)
        
        await self._redis.setex(
            key,
            ttl,
            json.dumps(data)
        )
    
    async def invalidate_message(self, message_id: UUID) -> None:
        """Invalidate cached message."""
        key = self._get_message_key(message_id)
        await self._redis.delete(key)


    async def notify_mention(
        self,
        mentioned_user_id: UUID,
        message: ChatMessage,
        group_name: str,
    ) -> None:
        """No-op — mention notifications are handled by the notification service."""
        pass

    async def notify_new_message(
        self,
        user_ids: list[UUID],
        message: ChatMessage,
        group_name: str,
    ) -> None:
        """No-op — new-message notifications are handled by the notification service."""
        pass

   
    def _get_group_key(self, group_id: UUID) -> str:
        """Get Redis key for a group."""
        return f"cache:group:{group_id}"
    
    def _get_message_key(self, message_id: UUID) -> str:
        """Get Redis key for a message."""
        return f"cache:message:{message_id}"
    
    def _serialize_group(self, group: ChatGroup) -> dict:
        """Serialize group to dict."""
        return {
            "id": str(group.id),
            "name": group.name,
            "description": group.description,
            "created_by": str(group.created_by),
            "created_at": group.created_at.isoformat(),
            "avatar_url": group.avatar_url,
            "is_private": group.is_private,
            "max_members": group.max_members,
            "members": [
                {
                    "user_id": str(m.user_id),
                    "username": m.username,
                    "role": m.role.value,
                    "joined_at": m.joined_at.isoformat(),
                    "last_read_at": m.last_read_at.isoformat() if m.last_read_at else None,
                    "is_muted": m.is_muted,
                }
                for m in group.members
            ]
        }
    
    def _deserialize_group(self, data: dict) -> ChatGroup:
        """Deserialize dict to group."""
        members = [
            ChatGroupMember(
                user_id=UUID(m["user_id"]),
                username=m["username"],
                role=ChatGroupRole(m["role"]),
                joined_at=datetime.fromisoformat(m["joined_at"]),
                last_read_at=datetime.fromisoformat(m["last_read_at"]) if m["last_read_at"] else None,
                is_muted=m["is_muted"],
            )
            for m in data["members"]
        ]
        
        return ChatGroup(
            id=UUID(data["id"]),
            name=data["name"],
            description=data["description"],
            created_by=UUID(data["created_by"]),
            created_at=datetime.fromisoformat(data["created_at"]),
            avatar_url=data["avatar_url"],
            is_private=data["is_private"],
            max_members=data["max_members"],
            members=members,
        )
    
    def _serialize_message(self, message: ChatMessage) -> dict:
        """Serialize message to dict."""
        return {
            "id": str(message.id),
            "group_id": str(message.group_id),
            "sender_id": str(message.sender_id),
            "content": message.content,
            "message_type": message.message_type.value,
            "created_at": message.created_at.isoformat(),
            "edited_at": message.edited_at.isoformat() if message.edited_at else None,
            "is_deleted": message.is_deleted,
            "reply_to_id": str(message.reply_to_id) if message.reply_to_id else None,
            "metadata": message.metadata,
            "mentions": [
                {
                    "user_id": str(m.user_id),
                    "username": m.username,
                    "start_index": m.start_index,
                    "end_index": m.end_index,
                }
                for m in message.mentions
            ]
        }
    
    def _deserialize_message(self, data: dict) -> ChatMessage:
        """Deserialize dict to message."""
        mentions = [
            ChatMemberMention(
                user_id=UUID(m["user_id"]),
                username=m["username"],
                start_index=m["start_index"],
                end_index=m["end_index"],
            )
            for m in data["mentions"]
        ]
        
        return ChatMessage(
            id=UUID(data["id"]),
            group_id=UUID(data["group_id"]),
            sender_id=UUID(data["sender_id"]),
            content=data["content"],
            message_type=MessageType(data["message_type"]),
            created_at=datetime.fromisoformat(data["created_at"]),
            edited_at=datetime.fromisoformat(data["edited_at"]) if data["edited_at"] else None,
            is_deleted=data["is_deleted"],
            reply_to_id=UUID(data["reply_to_id"]) if data["reply_to_id"] else None,
            metadata=data["metadata"],
            mentions=mentions,
        )
        
        