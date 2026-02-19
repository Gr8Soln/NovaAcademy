import uuid
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import (HTTPAuthorizationCredentials, HTTPBearer,
                              OAuth2PasswordBearer)
from jose import JWTError, jwt

from app.application.interfaces import (IEmailService, IJwtService,
                                        IUserInterface)
from app.application.use_cases import (ConfirmEmailUseCase,
                                       ForgotPasswordUseCase,
                                       GoogleAuthUseCase, LoginUseCase,
                                       RefreshTokenUseCase, RegisterUseCase,
                                       ResendConfirmEmailUseCase,
                                       ResetPasswordUseCase)
from app.core.config import Settings, get_settings, settings
from app.domain.entities import User
from app.domain.exceptions import AccountInactiveError, AuthenticationError

from app.infrastructure.api.dependencies import get_email_service, get_jwt_service, get_user_repository

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_PREFIX}/auth/login"
)

security = HTTPBearer()


# ── Auth guard ───────────────────────────────────────────────

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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )
    return user


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings: Settings = Depends(get_settings),
) -> UUID:
    """
    Extract and validate user ID from JWT token.

    Returns:
        User ID from token

    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )

        user_id: str = payload.get("user_id", "user-id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return UUID(user_id)

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Auth use-case factories ─────────────────────────────────


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
        raise ValueError(
            "Google Client ID must be set in settings for GoogleAuthUseCase"
        )
    return GoogleAuthUseCase(
        user_repo, jwt_srv, google_client_id=settings.GOOGLE_CLIENT_ID
    )


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
