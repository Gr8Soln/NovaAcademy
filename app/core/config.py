from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── App ─────────────────────────────────────────────────────
    APP_NAME: str = "NovaAcademy"
    API_PREFIX: str = "/api/v1"
    BASE_URL: str = "http://localhost:8000"
    LOG_DIR: str = "./logs"
    PORT: int = 8000
    ENV: str = "development"  # or "production"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    DEBUG: bool = False
    UI_BASE_URL: str = "http://localhost:5173"

    # ── Auth ────────────────────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 7 * 24 * 60  # 7 days
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 21 * 24 * 60  # 21 days

    # ── Google OAuth ────────────────────────────────────────────
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = f"{BASE_URL}{API_PREFIX}/auth/google/callback"

    # ── Database ────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:admin@localhost:5432/novaacademy"

    # ── Redis ───────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── Vector DB ───────────────────────────────────────────────
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    VECTOR_SIZE: int = 1536

    # ── LLM ─────────────────────────────────────────────────────
    OPENAI_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gpt-4.1"
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # ── File storage ────────────────────────────────────────────
    UPLOAD_DIR: str = "./uploads"
    MAX_IMAGE_SIZE_KB: int = 2048  # 2MB
    MAX_DOCUMENT_SIZE_MB: int = 10  # 10MB
    OPTIMIZE_IMAGES: bool = True

    # ── SMTP ────────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = "noreply@novaacademy.com"
    SMTP_PASSWORD: str = "change-me-in-production"
    SMTP_FROM_EMAIL: str = "noreply@novaacademy.com"
    
    EMAIL_TEMPLATE_DIR: Optional[str] = 'templates'
    USE_TLS: bool = True
    USE_SSL: bool = False
    
    WS_HEARTBEAT_INTERVAL: int = 30  # seconds
    WS_PRESENCE_TTL: int = 300  # seconds (5 minutes)
    WS_MAX_CONNECTIONS: int = 5000
    
    # Cache Settings
    CACHE_GROUP_TTL: int = 3600  # 1 hour
    CACHE_MESSAGE_TTL: int = 300  # 5 minutes
    
    # Rate Limiting
    RATE_LIMIT_MESSAGES_PER_MINUTE: int = 60
    RATE_LIMIT_API_PER_MINUTE: int = 120
    
    # Notification Settings
    ENABLE_MENTION_NOTIFICATIONS: bool = True
    ENABLE_EMAIL_NOTIFICATIONS: bool = False
    
    # Business Rules (Configurable limits)
    MAX_GROUP_MEMBERS: int = 1000
    MAX_MESSAGE_LENGTH: int = 10000
    MAX_MENTIONS_PER_MESSAGE: int = 50
    MESSAGE_RETENTION_DAYS: int = 0  # 0 = forever
    
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
