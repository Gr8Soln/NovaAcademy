from __future__ import annotations

from typing import TYPE_CHECKING

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
from app.application.use_cases import (AddClassMemberUseCase,
                                       ChangeClassMemberRoleUseCase,
                                       CreateClassUseCase,
                                       DeleteChatMessageUseCase,
                                       DeleteClassUseCase,
                                       EditChatMessageUseCase,
                                       GetChatMessagesUseCase, GetClassUseCase,
                                       GetJoinRequestsUseCase,
                                       GetUserClassesUseCase,
                                       HandleJoinRequestUseCase,
                                       JoinClassUseCase,
                                       RemoveClassMemberUseCase,
                                       SearchchatMessagesUseCase,
                                       SearchClassesUseCase,
                                       SendChatMessageUseCase,
                                       UpdateClassUseCase)
from app.core.config import Settings, get_settings
from app.infrastructure.db import get_db_session

if TYPE_CHECKING:
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
    from app.infrastructure.ws.connection_manager import \
        ConnectionManager as CM

    global _connection_manager

    if _connection_manager is None:
        pubsub = await get_chat_pubsub_service()
        _connection_manager = CM(pubsub)

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


# ---------------------------------------------------------------------------
# Class management use-case factories
# ---------------------------------------------------------------------------

async def get_create_class_usecase(
    group_repo: IChatGroupInterface = Depends(get_chat_group_repository),
    db=Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> CreateClassUseCase:
    from app.adapters.repositories import SQLUserRepository
    from app.adapters.services import LocalStorageService
    from app.application.interfaces import IUserInterface
    user_repo: IUserInterface = SQLUserRepository(db)
    storage = LocalStorageService(
        upload_dir=settings.UPLOAD_DIR if hasattr(settings, "UPLOAD_DIR") else "uploads",
        base_url=settings.BASE_URL if hasattr(settings, "BASE_URL") else "/api/v1/avatar",
    )
    return CreateClassUseCase(group_repo=group_repo, user_repo=user_repo, storage=storage)


async def get_get_user_classes_usecase(
    group_repo: IChatGroupInterface = Depends(get_chat_group_repository),
) -> GetUserClassesUseCase:
    return GetUserClassesUseCase(group_repo=group_repo)


async def get_get_class_usecase(
    group_repo: IChatGroupInterface = Depends(get_chat_group_repository),
) -> GetClassUseCase:
    return GetClassUseCase(group_repo=group_repo)


async def get_update_class_usecase(
    group_repo: IChatGroupInterface = Depends(get_chat_group_repository),
    settings: Settings = Depends(get_settings),
) -> UpdateClassUseCase:
    from app.adapters.services import LocalStorageService
    storage = LocalStorageService(
        upload_dir=settings.UPLOAD_DIR if hasattr(settings, "UPLOAD_DIR") else "uploads",
        base_url=settings.BASE_URL if hasattr(settings, "BASE_URL") else "/api/v1/avatar",
    )
    return UpdateClassUseCase(group_repo=group_repo, storage=storage)


async def get_delete_class_usecase(
    group_repo: IChatGroupInterface = Depends(get_chat_group_repository),
) -> DeleteClassUseCase:
    return DeleteClassUseCase(group_repo=group_repo)


async def get_add_class_member_usecase(
    group_repo: IChatGroupInterface = Depends(get_chat_group_repository),
    db=Depends(get_db_session),
) -> AddClassMemberUseCase:
    from app.adapters.repositories import SQLUserRepository
    from app.application.interfaces import IUserInterface
    user_repo: IUserInterface = SQLUserRepository(db)
    return AddClassMemberUseCase(group_repo=group_repo, user_repo=user_repo)


async def get_remove_class_member_usecase(
    group_repo: IChatGroupInterface = Depends(get_chat_group_repository),
) -> RemoveClassMemberUseCase:
    return RemoveClassMemberUseCase(group_repo=group_repo)


async def get_change_class_role_usecase(
    group_repo: IChatGroupInterface = Depends(get_chat_group_repository),
) -> ChangeClassMemberRoleUseCase:
    return ChangeClassMemberRoleUseCase(group_repo=group_repo)


async def get_search_classes_usecase(
    group_repo: IChatGroupInterface = Depends(get_chat_group_repository),
) -> SearchClassesUseCase:
    return SearchClassesUseCase(group_repo=group_repo)


async def get_join_class_usecase(
    group_repo: IChatGroupInterface = Depends(get_chat_group_repository),
    db=Depends(get_db_session),
) -> JoinClassUseCase:
    from app.adapters.repositories import SQLUserRepository
    from app.application.interfaces import IUserInterface
    user_repo: IUserInterface = SQLUserRepository(db)
    return JoinClassUseCase(group_repo=group_repo, user_repo=user_repo)


async def get_join_requests_usecase(
    group_repo: IChatGroupInterface = Depends(get_chat_group_repository),
) -> GetJoinRequestsUseCase:
    return GetJoinRequestsUseCase(group_repo=group_repo)


async def get_handle_join_request_usecase(
    group_repo: IChatGroupInterface = Depends(get_chat_group_repository),
) -> HandleJoinRequestUseCase:
    return HandleJoinRequestUseCase(group_repo=group_repo)
