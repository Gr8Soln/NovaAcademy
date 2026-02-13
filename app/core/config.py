"""Application configuration — reads from environment variables."""

from __future__ import annotations

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── App ─────────────────────────────────────────────────────
    APP_NAME: str = "Gr8Academy"
    DEBUG: bool = False
    API_PREFIX: str = "/api/v1"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # ── Auth ────────────────────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Google OAuth ────────────────────────────────────────────
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"

    # ── Database ────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:admin@localhost:5432/gr8academy"

    # ── Redis ───────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── Vector DB ───────────────────────────────────────────────
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    VECTOR_SIZE: int = 1536

    # ── LLM ─────────────────────────────────────────────────────
    OPENAI_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gpt-4.1"
    LLM_BASE_URL: Optional[str] = None  # For local models via Ollama, etc.
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # ── File storage ────────────────────────────────────────────
    UPLOAD_DIR: str = "./uploads"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
