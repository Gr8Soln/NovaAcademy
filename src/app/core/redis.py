"""Redis client factory."""

from __future__ import annotations

import redis.asyncio as aioredis

from app.core.config import settings

redis_client: aioredis.Redis = aioredis.from_url(settings.REDIS_URL, decode_responses=False)


async def get_redis() -> aioredis.Redis:
    return redis_client
