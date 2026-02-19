import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.repositories import (SQLChatGroupRepository,
                                       SQLChatMessageRepository,
                                       SQLUserRepository)
from app.adapters.services import (JWTAuthService, LocalStorageService,
                                   PushNotificationService, RedisCacheService,
                                   RedisPresenceService, RedisPubSubService,
                                   SMTPEmailService)
from app.application.interfaces import (IChatCacheInterface,
                                        IChatGroupInterface,
                                        IChatMessageInterface,
                                        IChatNotificationInterface,
                                        IChatPresenceService, IChatPubSub,
                                        IEmailService, IJwtService,
                                        IStorageService, IUserInterface)
from app.application.use_cases import (ChangePasswordUseCase,
                                       ConfirmEmailUseCase,
                                       DeactivateAccountUseCase,
                                       DeleteChatMessageUseCase,
                                       EditChatMessageUseCase,
                                       ForgotPasswordUseCase,
                                       GetChatMessagesUseCase,
                                       GetCurrentUserUseCase,
                                       GoogleAuthUseCase, LoginUseCase,
                                       RefreshTokenUseCase, RegisterUseCase,
                                       RemoveAvatarUseCase,
                                       ResendConfirmEmailUseCase,
                                       ResetPasswordUseCase,
                                       SearchchatMessagesUseCase,
                                       SendChatMessageUseCase,
                                       SetPasswordUseCase,
                                       UpdateProfileUseCase,
                                       UploadAvatarUseCase)
from app.core.config import Settings, get_settings, settings
from app.domain.entities import User
from app.domain.exceptions import AccountInactiveError, AuthenticationError
from app.infrastructure.db import get_db_session
from app.infrastructure.ws.connection_manager import ConnectionManager

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_PREFIX}/auth/login")

# ----- Core providers -----------------------------------

def get_user_repository(session: AsyncSession = Depends(get_db_session)) -> IUserInterface:
    return SQLUserRepository(session)

async def get_jwt_service() -> IJwtService:
    return JWTAuthService(
        secret_key=settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
        access_token_expire_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        refresh_token_expire_minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES,
        google_client_id=settings.GOOGLE_CLIENT_ID,
        google_client_secret=settings.GOOGLE_CLIENT_SECRET,
        google_redirect_uri=settings.GOOGLE_REDIRECT_URI,
    )

async def get_email_service() -> IEmailService:
    return SMTPEmailService(
        smtp_host=settings.SMTP_HOST,
        smtp_port=settings.SMTP_PORT,
        smtp_username=settings.SMTP_USERNAME,
        smtp_password=settings.SMTP_PASSWORD,
        from_email=settings.SMTP_FROM_EMAIL,
        from_name=settings.APP_NAME,
        template_dir=settings.EMAIL_TEMPLATE_DIR,
        base_url=settings.UI_BASE_URL,
        use_tls=settings.USE_TLS,
        use_ssl=settings.USE_SSL
    )

async def get_storage_service() -> IStorageService:
    return LocalStorageService(
        upload_dir=settings.UPLOAD_DIR,
        base_url=settings.BASE_URL
    )

# ----- Auth guard ----------------------------------------

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: IUserInterface = Depends(get_user_repository),
    jwt_svc: IJwtService = Depends(get_jwt_service),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        user_id: uuid.UUID = jwt_svc.decode_access_token(token)
    except (AuthenticationError, Exception):
        raise credentials_exception

    user = await user_repo.get_by_id(user_id)
    if not user:
        raise credentials_exception
    try:
        if not user.is_active:
            raise AccountInactiveError()
    except AccountInactiveError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")
    return user

# ----- Auth use-case factories ---------------------------

def get_register_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
    jwt_srv: IJwtService = Depends(get_jwt_service),
    email_svc: IEmailService = Depends(get_email_service),
) -> RegisterUseCase:
    return RegisterUseCase(user_repo, jwt_srv, email_svc)

def get_login_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
    jwt_srv: IJwtService = Depends(get_jwt_service),
) -> LoginUseCase:
    return LoginUseCase(user_repo, jwt_srv)

def get_google_auth_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
    jwt_srv: IJwtService = Depends(get_jwt_service),
) -> GoogleAuthUseCase:
    if not settings.GOOGLE_CLIENT_ID:
        raise ValueError("Google Client ID must be set in settings for GoogleAuthUseCase")
    return GoogleAuthUseCase(user_repo, jwt_srv, google_client_id=settings.GOOGLE_CLIENT_ID)

def get_refresh_token_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
    jwt_srv: IJwtService = Depends(get_jwt_service),
) -> RefreshTokenUseCase:
    return RefreshTokenUseCase(user_repo, jwt_srv)

def get_forgot_password_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
    jwt_srv: IJwtService = Depends(get_jwt_service),
    email_svc: IEmailService = Depends(get_email_service),
) -> ForgotPasswordUseCase:
    return ForgotPasswordUseCase(user_repo, jwt_srv, email_svc)

def get_reset_password_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
    jwt_srv: IJwtService = Depends(get_jwt_service),
) -> ResetPasswordUseCase:
    return ResetPasswordUseCase(user_repo, jwt_srv)

def get_confirm_email_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
    jwt_srv: IJwtService = Depends(get_jwt_service),
) -> ConfirmEmailUseCase:
    return ConfirmEmailUseCase(user_repo, jwt_srv)

def get_resend_confirm_email_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
    jwt_srv: IJwtService = Depends(get_jwt_service),
    email_svc: IEmailService = Depends(get_email_service),
) -> ResendConfirmEmailUseCase:
    return ResendConfirmEmailUseCase(user_repo, jwt_srv, email_svc)

# ----- User use-case factories ---------------------------

def get_current_user_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
) -> GetCurrentUserUseCase:
    return GetCurrentUserUseCase(user_repo)

def get_update_profile_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
) -> UpdateProfileUseCase:
    return UpdateProfileUseCase(user_repo)

def get_upload_avatar_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
    storage: IStorageService = Depends(get_storage_service),
) -> UploadAvatarUseCase:
    return UploadAvatarUseCase(user_repo, storage)

def get_remove_avatar_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
) -> RemoveAvatarUseCase:
    return RemoveAvatarUseCase(user_repo)

def get_set_password_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
    jwt_svc: IJwtService = Depends(get_jwt_service),
) -> SetPasswordUseCase:
    return SetPasswordUseCase(user_repo, jwt_svc)

def get_change_password_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
    jwt_svc: IJwtService = Depends(get_jwt_service),
) -> ChangePasswordUseCase:
    return ChangePasswordUseCase(user_repo, jwt_svc)

def get_deactivate_account_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
) -> DeactivateAccountUseCase:
    return DeactivateAccountUseCase(user_repo)



# ----- Class chat use-case factories ---------------------------


# src/infrastructure/api/dependencies.py

from functools import lru_cache
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

# =============================================================================
# GLOBAL SINGLETONS (Cached for application lifetime)
# =============================================================================

_pubsub_instance: RedisPubSubService | None = None
_presence_instance: RedisPresenceService | None = None
_cache_instance: RedisCacheService | None = None
_connection_manager: ConnectionManager | None = None


async def get_chat_pubsub_service(settings: Settings = Depends(get_settings)) -> IChatPubSub:
    """
    Get Redis Pub/Sub service (singleton).
    
    WHY singleton:
    - Maintains persistent Redis connections
    - Manages subscriptions across requests
    - One instance per FastAPI application
    """
    global _pubsub_instance
    
    if _pubsub_instance is None:
        _pubsub_instance = RedisPubSubService(settings.REDIS_URL)
        await _pubsub_instance.connect()
    
    return _pubsub_instance


async def get_chat_presence_service(settings: Settings = Depends(get_settings)) -> IChatPresenceService:
    """Get presence service (singleton)."""
    global _presence_instance
    
    if _presence_instance is None:
        _presence_instance = RedisPresenceService(settings.REDIS_URL)
        await _presence_instance.connect()
    
    return _presence_instance


async def get_chat_cache_service(settings: Settings = Depends(get_settings)) -> IChatCacheInterface:
    """Get cache service (singleton)."""
    global _cache_instance
    
    if _cache_instance is None:
        _cache_instance = RedisCacheService(settings.REDIS_URL)
        await _cache_instance.connect()
    
    return _cache_instance


async def get_connection_manager() -> ConnectionManager:
    """
    Get WebSocket connection manager (singleton).
    
    WHY singleton:
    - Manages all WebSocket connections for this instance
    - One manager per FastAPI application instance
    """
    global _connection_manager
    
    if _connection_manager is None:
        pubsub = await get_chat_pubsub_service()
        _connection_manager = ConnectionManager(pubsub)
    
    return _connection_manager


# =============================================================================
# REPOSITORIES (New instance per request)
# =============================================================================

async def get_chat_message_repository(
    db: AsyncSession = Depends(get_db_session)
) -> IChatMessageInterface:
    """Get message repository."""
    return SQLChatMessageRepository(db)


async def get_chat_group_repository(
    db: AsyncSession = Depends(get_db_session)
) -> IChatGroupInterface:
    """Get group repository."""
    return SQLChatGroupRepository(db)


# =============================================================================
# NOTIFICATION SERVICE
# =============================================================================

async def get_chat_notification_service(
    settings: Settings = Depends(get_settings)
) -> IChatNotificationInterface:
    """Get notification service."""
    return PushNotificationService(
        # Configure with your push notification provider
        # e.g., Firebase, OneSignal, custom implementation
    )


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



async def startup_event():
    """
    Initialize services on application startup.
    
    Call this in your main.py:
    
    @app.on_event("startup")
    async def startup():
        await startup_event()
    """
    settings = get_settings()
    
    # Initialize Redis connections
    await get_chat_pubsub_service(settings)
    await get_chat_presence_service(settings)
    await get_chat_cache_service(settings)
    
    print("✅ Chat services initialized")


async def shutdown_event():
    """
    Cleanup on application shutdown.
    
    Call this in your main.py:
    
    @app.on_event("shutdown")
    async def shutdown():
        await shutdown_event()
    """
    global _pubsub_instance, _presence_instance, _cache_instance, _connection_manager
    
    # Disconnect Redis connections
    if _pubsub_instance:
        await _pubsub_instance.disconnect()
    
    if _presence_instance:
        await _presence_instance.disconnect()
    
    if _cache_instance:
        await _cache_instance.disconnect()
    
    # Close all WebSocket connections
    if _connection_manager:
        await _connection_manager.shutdown()
    
    print("✅ Chat services shut down gracefully")