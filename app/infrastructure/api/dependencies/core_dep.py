from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.repositories import SQLUserRepository
from app.adapters.services import (JWTAuthService, LocalStorageService,
                                   SMTPEmailService)
from app.application.interfaces import (IEmailService, IJwtService,
                                        IStorageService, IUserInterface)
from app.core.config import settings
from app.infrastructure.db import get_db_session


def get_user_repository(
    session: AsyncSession = Depends(get_db_session),
) -> IUserInterface:
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
        use_ssl=settings.USE_SSL,
    )


async def get_storage_service() -> IStorageService:
    return LocalStorageService(
        upload_dir=settings.UPLOAD_DIR, base_url=settings.BASE_URL
    )
