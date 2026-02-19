import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.repositories import SQLUserRepository
from app.adapters.services import (JWTAuthService, LocalStorageService,
                                   SMTPEmailService)
from app.application.interfaces import (IEmailService, IJwtService,
                                        IStorageService, IUserInterface)
from app.application.use_cases import (ChangePasswordUseCase,
                                       ConfirmEmailUseCase,
                                       DeactivateAccountUseCase,
                                       ForgotPasswordUseCase,
                                       GetCurrentUserUseCase,
                                       GoogleAuthUseCase, LoginUseCase,
                                       RefreshTokenUseCase, RegisterUseCase,
                                       RemoveAvatarUseCase,
                                       ResendConfirmEmailUseCase,
                                       ResetPasswordUseCase,
                                       SetPasswordUseCase,
                                       UpdateProfileUseCase,
                                       UploadAvatarUseCase)
from app.core.config import settings
from app.domain.entities import User
from app.domain.exceptions import AccountInactiveError, AuthenticationError
from app.infrastructure.db import get_db_session

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
) -> UploadAvatarUseCase:
    return UploadAvatarUseCase(user_repo)

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
