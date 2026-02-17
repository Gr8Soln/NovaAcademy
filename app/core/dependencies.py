"""Dependency Injection container — wires interfaces to implementations.

Change only THIS file to swap providers (e.g. Qdrant → Pinecone, OpenAI → Ollama).
"""

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db_session
from app.core.redis import get_redis
from app.core.vector import get_qdrant
from app.domain.entities.user import User
from app.domain.exceptions import AuthenticationError
from app.infrastructure.auth.jwt_auth_service import JWTAuthService
from app.infrastructure.cache.redis_cache_service import RedisCacheService
from app.infrastructure.db.postgres.challenge_repository import \
    PostgresChallengeRepository
from app.infrastructure.db.postgres.document_repository import \
    PostgresDocumentRepository
from app.infrastructure.db.postgres.notification_repository import \
    PostgresNotificationRepository
from app.infrastructure.db.postgres.point_transaction_repository import \
    PostgresPointTransactionRepository
from app.infrastructure.db.postgres.quiz_repository import \
    PostgresQuizRepository
from app.infrastructure.db.postgres.student_progress_repository import \
    PostgresStudentProgressRepository
from app.infrastructure.db.postgres.study_session_repository import \
    PostgresStudySessionRepository
from app.infrastructure.db.postgres.user_repository import \
    PostgresUserRepository
from app.infrastructure.leaderboard.redis_leaderboard_service import \
    RedisLeaderboardService
from app.infrastructure.llm.openai_embedding_service import \
    OpenAIEmbeddingService
from app.infrastructure.llm.openai_llm_service import OpenAILLMService
from app.infrastructure.notifications.sse_notification_push_service import \
    SSENotificationPushService
from app.infrastructure.parser.document_parser_service import \
    LocalDocumentParserService
from app.infrastructure.vector.qdrant.vector_repository import \
    QdrantVectorRepository
from app.interfaces.repositories.challenge_repository import \
    IChallengeRepository
from app.interfaces.repositories.document_repository import IDocumentRepository
from app.interfaces.repositories.notification_repository import \
    INotificationRepository
from app.interfaces.repositories.point_transaction_repository import \
    IPointTransactionRepository
from app.interfaces.repositories.quiz_repository import IQuizRepository
from app.interfaces.repositories.student_progress_repository import \
    IStudentProgressRepository
from app.interfaces.repositories.study_session_repository import \
    IStudySessionRepository
from app.interfaces.repositories.user_repository import IUserRepository
from app.interfaces.repositories.vector_repository import IVectorRepository
from app.interfaces.services.auth_service import IAuthService
from app.interfaces.services.cache_service import ICacheService
from app.interfaces.services.document_parser_service import \
    IDocumentParserService
from app.interfaces.services.embedding_service import IEmbeddingService
from app.interfaces.services.leaderboard_service import ILeaderboardService
from app.interfaces.services.llm_service import ILLMService
from app.interfaces.services.notification_push_service import \
    INotificationPushService

# ── Repository factories ────────────────────────────────────────



# ── Service factories ───────────────────────────────────────────



# ── Singletons for stateful services ───────────────────────────
_notification_push_service = SSENotificationPushService()


# ═══════════════════════════════════════════════════════════════
# Repositories
# ═══════════════════════════════════════════════════════════════

async def get_user_repository(session: AsyncSession = Depends(get_db_session)) -> IUserRepository:
    return PostgresUserRepository(session)


async def get_document_repository(session: AsyncSession = Depends(get_db_session)) -> IDocumentRepository:
    return PostgresDocumentRepository(session)


async def get_quiz_repository(session: AsyncSession = Depends(get_db_session)) -> IQuizRepository:
    return PostgresQuizRepository(session)


async def get_student_progress_repository(session: AsyncSession = Depends(get_db_session)) -> IStudentProgressRepository:
    return PostgresStudentProgressRepository(session)


async def get_vector_repository() -> IVectorRepository:
    client = await get_qdrant()
    return QdrantVectorRepository(client, vector_size=settings.VECTOR_SIZE)


async def get_notification_repository(session: AsyncSession = Depends(get_db_session)) -> INotificationRepository:
    return PostgresNotificationRepository(session)


async def get_challenge_repository(session: AsyncSession = Depends(get_db_session)) -> IChallengeRepository:
    return PostgresChallengeRepository(session)


async def get_point_transaction_repository(session: AsyncSession = Depends(get_db_session)) -> IPointTransactionRepository:
    return PostgresPointTransactionRepository(session)


async def get_study_session_repository(session: AsyncSession = Depends(get_db_session)) -> IStudySessionRepository:
    return PostgresStudySessionRepository(session)


# ═══════════════════════════════════════════════════════════════
# Services
# ═══════════════════════════════════════════════════════════════

async def get_auth_service() -> IAuthService:
    return JWTAuthService(
        secret_key=settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
        access_token_expire_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        refresh_token_expire_days=settings.REFRESH_TOKEN_EXPIRE_DAYS,
        google_client_id=settings.GOOGLE_CLIENT_ID,
        google_client_secret=settings.GOOGLE_CLIENT_SECRET,
        google_redirect_uri=settings.GOOGLE_REDIRECT_URI,
    )


async def get_cache_service() -> ICacheService:
    redis = await get_redis()
    return RedisCacheService(redis)


async def get_llm_service() -> ILLMService:
    return OpenAILLMService(
        api_key=settings.OPENAI_API_KEY or "",
        model=settings.LLM_MODEL,
        base_url=settings.LLM_BASE_URL,
    )


async def get_embedding_service() -> IEmbeddingService:
    return OpenAIEmbeddingService(
        api_key=settings.OPENAI_API_KEY or "",
        model=settings.EMBEDDING_MODEL,
        base_url=settings.LLM_BASE_URL,
    )


async def get_document_parser_service() -> IDocumentParserService:
    return LocalDocumentParserService()


# ── Social feature services ─────────────────────────────────────

async def get_leaderboard_service() -> ILeaderboardService:
    redis = await get_redis()
    return RedisLeaderboardService(redis)


async def get_notification_push_service() -> INotificationPushService:
    return _notification_push_service


# ═══════════════════════════════════════════════════════════════
# Auth — extract current user from JWT
# ═══════════════════════════════════════════════════════════════

http_bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer_scheme),
    user_repo: IUserRepository = Depends(get_user_repository),
    auth_service: IAuthService = Depends(get_auth_service),
) -> User:
    """Extract and validate the current user from the Authorization header."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization credentials")

    try:
        user_id = auth_service.decode_access_token(credentials.credentials)
    except AuthenticationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    user = await user_repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user
