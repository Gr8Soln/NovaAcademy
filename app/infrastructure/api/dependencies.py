from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.repositories import SQLUserRepository
from app.adapters.services import JWTAuthService
from app.application.interfaces import IJwtService, IUserInterface
from app.application.use_cases import (GoogleAuthUseCase, LoginUseCase,
                                       RegisterUseCase)
from app.core.config import settings
from app.infrastructure.db import get_db_session

# ----- Auth Dependencies ---------------------------------

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

def get_register_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
    jwt_srv: IJwtService = Depends(get_jwt_service),
) -> RegisterUseCase:
    return RegisterUseCase(user_repo, jwt_srv)

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

    
# ----- User Dependencies ---------------------------------