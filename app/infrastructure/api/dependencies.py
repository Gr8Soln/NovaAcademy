from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.repositories import SQLUserRepository
from app.adapters.services import JWTAuthService
from app.application.interfaces import IJwtService, IUserInterface
from app.application.use_cases import RegisterUseCase
from app.core.config import Settings
from app.infrastructure.db import get_db_session

# ----- Auth Dependencies ---------------------------------

def get_user_repository(session: AsyncSession = Depends(get_db_session)) -> IUserInterface:
    return SQLUserRepository(session)

async def get_jwt_service() -> IJwtService:
    return JWTAuthService(
        secret_key=Settings.SECRET_KEY,
        algorithm=Settings.ALGORITHM,
        access_token_expire_minutes=Settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        REFRESH_TOKEN_EXPIRE_MINUTES=Settings.REFRESH_TOKEN_EXPIRE_MINUTES,
        google_client_id=Settings.GOOGLE_CLIENT_ID,
        google_client_secret=Settings.GOOGLE_CLIENT_SECRET,
        google_redirect_uri=Settings.GOOGLE_REDIRECT_URI,
    )

def get_register_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
    jwt_srv: IJwtService = Depends(get_jwt_service),
) -> RegisterUseCase:
    return RegisterUseCase(user_repo, jwt_srv)