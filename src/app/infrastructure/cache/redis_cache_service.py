"""Redis cache service implementation."""

from __future__ import annotations

from typing import Optional

import redis.asyncio as aioredis

from app.interfaces.services.cache_service import ICacheService


class RedisCacheService(ICacheService):
    def __init__(self, redis_client: aioredis.Redis) -> None:
        self._redis = redis_client

    async def get(self, key: str) -> Optional[str]:
        val = await self._redis.get(key)
        return val.decode() if val else None

    async def set(self, key: str, value: str, ttl_seconds: int | None = None) -> None:
        if ttl_seconds:
            await self._redis.setex(key, ttl_seconds, value)
        else:
            await self._redis.set(key, value)

    async def delete(self, key: str) -> None:
        await self._redis.delete(key)

    async def exists(self, key: str) -> bool:
        return bool(await self._redis.exists(key))
