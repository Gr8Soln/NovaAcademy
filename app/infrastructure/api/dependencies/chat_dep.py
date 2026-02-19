from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.repositories import (SQLChatGroupRepository,
                                       SQLChatMessageRepository)
from app.adapters.services import (PushNotificationService, RedisCacheService,
                                   RedisPresenceService, RedisPubSubService)
from app.application.interfaces import (IChatCacheInterface,
                                        IChatGroupInterface,
                                        IChatMessageInterface,
                                        IChatNotificationInterface,
                                        IChatPresenceService, IChatPubSub)
from app.application.use_cases import (DeleteChatMessageUseCase,
                                       EditChatMessageUseCase,
                                       GetChatMessagesUseCase,
                                       SearchchatMessagesUseCase,
                                       SendChatMessageUseCase)
from app.core.config import Settings, get_settings
from app.infrastructure.db import get_db_session
from app.infrastructure.ws.connection_manager import ConnectionManager

_pubsub_instance: RedisPubSubService | None = None
_presence_instance: RedisPresenceService | None = None
_cache_instance: RedisCacheService | None = None
_connection_manager: ConnectionManager | None = None


async def get_chat_pubsub_service(
    settings: Settings = Depends(get_settings),
) -> IChatPubSub:
    global _pubsub_instance

    if _pubsub_instance is None:
        _pubsub_instance = RedisPubSubService(settings.REDIS_URL)
        await _pubsub_instance.connect()

    return _pubsub_instance


async def get_chat_presence_service(
    settings: Settings = Depends(get_settings),
) -> IChatPresenceService:
    """Get presence service (singleton)."""
    global _presence_instance

    if _presence_instance is None:
        _presence_instance = RedisPresenceService(settings.REDIS_URL)
        await _presence_instance.connect()

    return _presence_instance


async def get_chat_cache_service(
    settings: Settings = Depends(get_settings),
) -> IChatCacheInterface:
    """Get cache service (singleton)."""
    global _cache_instance

    if _cache_instance is None:
        _cache_instance = RedisCacheService(settings.REDIS_URL)
        await _cache_instance.connect()

    return _cache_instance


async def get_connection_manager() -> ConnectionManager:
    global _connection_manager

    if _connection_manager is None:
        pubsub = await get_chat_pubsub_service()
        _connection_manager = ConnectionManager(pubsub)

    return _connection_manager



async def get_chat_message_repository(
    db: AsyncSession = Depends(get_db_session),
) -> IChatMessageInterface:
    """Get message repository."""
    return SQLChatMessageRepository(db)


async def get_chat_group_repository(
    db: AsyncSession = Depends(get_db_session),
) -> IChatGroupInterface:
    """Get group repository."""
    return SQLChatGroupRepository(db)



async def get_chat_notification_service(
    settings: Settings = Depends(get_settings),
) -> IChatNotificationInterface:
    """Get notification service."""
    return PushNotificationService()


# =============================================================================
# USE CASES (New instance per request)
# =============================================================================


async def get_chat_send_message_use_case(
    message_repo: IChatMessageInterface = Depends(get_chat_message_repository),
    group_repo: IChatGroupInterface = Depends(get_chat_group_repository),
    pubsub: IChatPubSub = Depends(get_chat_pubsub_service),
    cache: IChatCacheInterface = Depends(get_chat_cache_service),
    notification: IChatNotificationInterface = Depends(get_chat_notification_service),
) -> SendChatMessageUseCase:
    """Get SendMessage use case with all dependencies injected."""
    return SendChatMessageUseCase(
        message_repo=message_repo,
        group_repo=group_repo,
        pubsub=pubsub,
        cache=cache,
        notification_service=notification,
    )


async def get_chat_messages_use_case(
    message_repo: IChatMessageInterface = Depends(get_chat_message_repository),
    group_repo: IChatGroupInterface = Depends(get_chat_group_repository),
) -> GetChatMessagesUseCase:
    """Get GetMessages use case."""
    return GetChatMessagesUseCase(
        message_repo=message_repo,
        group_repo=group_repo,
    )


async def get_edit_chat_message_use_case(
    message_repo: IChatMessageInterface = Depends(get_chat_message_repository),
    cache: IChatCacheInterface = Depends(get_chat_cache_service),
    pubsub: IChatPubSub = Depends(get_chat_pubsub_service),
) -> EditChatMessageUseCase:
    """Get EditMessage use case."""
    return EditChatMessageUseCase(
        message_repo=message_repo,
        cache=cache,
        pubsub=pubsub,
    )


async def get_delete_chat_message_use_case(
    message_repo: IChatMessageInterface = Depends(get_chat_message_repository),
    group_repo: IChatGroupInterface = Depends(get_chat_group_repository),
    cache: IChatCacheInterface = Depends(get_chat_cache_service),
    pubsub: IChatPubSub = Depends(get_chat_pubsub_service),
) -> DeleteChatMessageUseCase:
    """Get DeleteMessage use case."""
    return DeleteChatMessageUseCase(
        message_repo=message_repo,
        group_repo=group_repo,
        cache=cache,
        pubsub=pubsub,
    )


async def get_search_chat_messages_use_case(
    message_repo: IChatMessageInterface = Depends(get_chat_message_repository),
    group_repo: IChatGroupInterface = Depends(get_chat_group_repository),
) -> SearchchatMessagesUseCase:
    """Get SearchMessages use case."""
    return SearchchatMessagesUseCase(
        message_repo=message_repo,
        group_repo=group_repo,
    )
