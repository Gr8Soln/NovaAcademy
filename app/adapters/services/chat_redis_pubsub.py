import asyncio
import json
from typing import Any, Callable, Dict
from uuid import UUID

import redis.asyncio as redis

from app.application.interfaces import IChatPresenceService, IChatPubSub
from app.domain.entities import ChatMessage


class RedisPubSubService(IChatPubSub):    
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self._publisher: Any  # redis.asyncio.Redis (stubs are sync-typed)
        self._subscriber: Any  # redis.asyncio.Redis
        self._pubsub: Any
        self._subscriptions: Dict[str, asyncio.Task] = {}  # channel -> task
        self._callbacks: Dict[str, Callable] = {}  # channel -> callback
    
    async def connect(self):
        """Initialize Redis connections."""
        # Separate connections for pub and sub (Redis best practice)
        self._publisher = await redis.from_url(
            self.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
        self._subscriber = await redis.from_url(
            self.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
        self._pubsub = self._subscriber.pubsub()
    
    async def disconnect(self):
        """Close Redis connections."""
        # Cancel all subscription tasks
        for task in self._subscriptions.values():
            task.cancel()
        
        if self._pubsub:
            await self._pubsub.close()
        
        if self._publisher:
            await self._publisher.close()
        
        if self._subscriber:
            await self._subscriber.close()
    
    async def publish_message(self, group_id: UUID, message: ChatMessage) -> None:
        """
        Publish a message to a group channel.
        
        ChatMessage is JSON-serialized for transmission.
        """
        channel = self._get_channel_name(group_id)
        
        # Serialize message to dict
        message_dict = {
            "type": "message",
            "data": {
                "id": str(message.id),
                "group_id": str(message.group_id),
                "sender_id": str(message.sender_id),
                "content": message.content,
                "message_type": message.message_type.value,
                "mentions": [
                    {
                        "user_id": str(m.user_id),
                        "username": m.username,
                        "start_index": m.start_index,
                        "end_index": m.end_index,
                    }
                    for m in message.mentions
                ],
                "created_at": message.created_at.isoformat(),
                "edited_at": message.edited_at.isoformat() if message.edited_at else None,
                "is_deleted": message.is_deleted,
                "reply_to_id": str(message.reply_to_id) if message.reply_to_id else None,
                "metadata": message.metadata,
            }
        }
        
        # Publish to Redis channel
        await self._publisher.publish(channel, json.dumps(message_dict))
    
    async def publish_typing_indicator(
        self,
        group_id: UUID,
        user_id: UUID,
        username: str,
        is_typing: bool,
    ) -> None:
        """Publish typing indicator."""
        channel = self._get_channel_name(group_id)
        
        event = {
            "type": "typing",
            "data": {
                "user_id": str(user_id),
                "username": username,
                "is_typing": is_typing,
            }
        }
        
        await self._publisher.publish(channel, json.dumps(event))
    
    async def publish_user_joined(
        self,
        group_id: UUID,
        user_id: UUID,
        username: str,
    ) -> None:
        """Publish user joined event."""
        channel = self._get_channel_name(group_id)
        
        event = {
            "type": "user_joined",
            "data": {
                "user_id": str(user_id),
                "username": username,
            }
        }
        
        await self._publisher.publish(channel, json.dumps(event))
    
    async def publish_user_left(
        self,
        group_id: UUID,
        user_id: UUID,
        username: str,
    ) -> None:
        """Publish user left event."""
        channel = self._get_channel_name(group_id)
        
        event = {
            "type": "user_left",
            "data": {
                "user_id": str(user_id),
                "username": username,
            }
        }
        
        await self._publisher.publish(channel, json.dumps(event))
    
    async def subscribe_to_group(self, group_id: UUID, callback: Callable) -> None:
        """
        Subscribe to a group's channel.
        
        The callback will be invoked for every message published to this channel.
        
        Args:
            group_id: ChatGroup to subscribe to
            callback: async function(event_data: dict) to handle events
        """
        channel = self._get_channel_name(group_id)
        
        # Already subscribed?
        if channel in self._subscriptions:
            return
        
        # Subscribe to Redis channel
        await self._pubsub.subscribe(channel)
        
        # Store callback
        self._callbacks[channel] = callback
        
        # Start listening task
        task = asyncio.create_task(self._listen_to_channel(channel))
        self._subscriptions[channel] = task
    
    async def unsubscribe_from_group(self, group_id: UUID) -> None:
        """Unsubscribe from a group's channel."""
        channel = self._get_channel_name(group_id)
        
        # Cancel listening task
        if channel in self._subscriptions:
            self._subscriptions[channel].cancel()
            del self._subscriptions[channel]
        
        # Remove callback
        if channel in self._callbacks:
            del self._callbacks[channel]
        
        # Unsubscribe from Redis
        await self._pubsub.unsubscribe(channel)
    
    async def _listen_to_channel(self, channel: str):
        """
        Listen to a Redis channel and invoke callback for each message.
        
        This runs as a background task for each subscribed channel.
        """
        try:
            async for message in self._pubsub.listen():
                if message["type"] == "message":
                    try:
                        # Deserialize event
                        event_data = json.loads(message["data"])
                        
                        # Invoke callback
                        callback = self._callbacks.get(channel)
                        if callback:
                            await callback(event_data)
                    
                    except Exception as e:
                        print(f"Error processing message on {channel}: {e}")
        
        except asyncio.CancelledError:
            # Task was cancelled (unsubscribe)
            pass
        
        except Exception as e:
            print(f"Error in subscription task for {channel}: {e}")
    
    def _get_channel_name(self, group_id: UUID) -> str:
        """Get Redis channel name for a group."""
        return f"chat:group:{group_id}"




class RedisPresenceService(IChatPresenceService):    
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self._redis: Any  # redis.asyncio.Redis (stubs are sync-typed)
        self.presence_ttl = 300  # 5 minutes
    
    async def connect(self):
        """Initialize Redis connection."""
        self._redis = await redis.from_url(self.redis_url)
    
    async def disconnect(self):
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
    
    async def set_user_online(self, user_id: UUID, group_id: UUID) -> None:
        """
        Mark user as online in a group.
        
        Client should call this periodically (every 30-60 seconds) as heartbeat.
        """
        key = self._get_presence_key(group_id)
        
        # Add user to online set
        await self._redis.sadd(key, str(user_id))
        
        # Set expiry (will be refreshed on next heartbeat)
        await self._redis.expire(key, self.presence_ttl)
    
    async def set_user_offline(self, user_id: UUID, group_id: UUID) -> None:
        """Mark user as offline in a group."""
        key = self._get_presence_key(group_id)
        await self._redis.srem(key, str(user_id))
    
    async def get_online_users(self, group_id: UUID) -> list[UUID]:
        """Get list of online users in a group."""
        key = self._get_presence_key(group_id)
        user_ids = await self._redis.smembers(key)
        return [UUID(uid) for uid in user_ids]
    
    async def is_user_online(self, user_id: UUID, group_id: UUID) -> bool:
        """Check if a user is online in a group."""
        key = self._get_presence_key(group_id)
        return bool(await self._redis.sismember(key, str(user_id)))
    
    def _get_presence_key(self, group_id: UUID) -> str:
        """Get Redis key for group presence."""
        return f"presence:group:{group_id}"