"""Redis leaderboard service — sorted sets for realtime rankings."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

import redis.asyncio as aioredis

from app.interfaces.services.leaderboard_service import (ILeaderboardService,
                                                         LeaderboardEntry,
                                                         LeaderboardPeriod,
                                                         LeaderboardType)


class RedisLeaderboardService(ILeaderboardService):
    """Leaderboard backed by Redis sorted sets.

    Key format:  leaderboard:{type}:{period}:{period_key}
    Examples:    leaderboard:points:weekly:2024-W03
                 leaderboard:study_time:monthly:2024-01
                 leaderboard:points:all_time:global
    """

    def __init__(self, redis: aioredis.Redis) -> None:
        self._redis = redis

    # ── Key helpers ─────────────────────────────────────────────

    @staticmethod
    def _period_key(period: LeaderboardPeriod) -> str:
        now = datetime.utcnow()
        if period == LeaderboardPeriod.WEEKLY:
            return now.strftime("%G-W%V")
        if period == LeaderboardPeriod.MONTHLY:
            return now.strftime("%Y-%m")
        return "global"

    def _redis_key(self, board_type: LeaderboardType, period: LeaderboardPeriod) -> str:
        return f"leaderboard:{board_type.value}:{period.value}:{self._period_key(period)}"

    # ── Interface implementation ────────────────────────────────

    async def increment_score(
        self, user_id: uuid.UUID, board_type: LeaderboardType, amount: float
    ) -> None:
        """Increment across all periods in parallel."""
        pipe = self._redis.pipeline(transaction=False)
        for period in LeaderboardPeriod:
            key = self._redis_key(board_type, period)
            pipe.zincrby(key, amount, str(user_id))
            # Auto-expire rolling windows (weekly=8d, monthly=32d)
            if period == LeaderboardPeriod.WEEKLY:
                pipe.expire(key, 8 * 86400)
            elif period == LeaderboardPeriod.MONTHLY:
                pipe.expire(key, 32 * 86400)
        await pipe.execute()

    async def get_rank(
        self, user_id: uuid.UUID, board_type: LeaderboardType, period: LeaderboardPeriod
    ) -> Optional[LeaderboardEntry]:
        key = self._redis_key(board_type, period)
        uid = str(user_id)
        pipe = self._redis.pipeline(transaction=False)
        pipe.zrevrank(key, uid)
        pipe.zscore(key, uid)
        results = await pipe.execute()
        rank, score = results[0], results[1]
        if rank is None:
            return None
        return LeaderboardEntry(user_id=user_id, score=float(score), rank=int(rank) + 1)

    async def get_top(
        self, board_type: LeaderboardType, period: LeaderboardPeriod, limit: int = 100
    ) -> list[LeaderboardEntry]:
        key = self._redis_key(board_type, period)
        entries = await self._redis.zrevrange(key, 0, limit - 1, withscores=True)
        result: list[LeaderboardEntry] = []
        for rank, (uid, score) in enumerate(entries, start=1):
            result.append(
                LeaderboardEntry(
                    user_id=uuid.UUID(uid.decode() if isinstance(uid, bytes) else uid),
                    score=float(score),
                    rank=rank,
                )
            )
        return result

    async def get_around_user(
        self,
        user_id: uuid.UUID,
        board_type: LeaderboardType,
        period: LeaderboardPeriod,
        count: int = 5,
    ) -> list[LeaderboardEntry]:
        key = self._redis_key(board_type, period)
        uid = str(user_id)
        rank = await self._redis.zrevrank(key, uid)
        if rank is None:
            return []
        start = max(0, rank - count)
        end = rank + count
        entries = await self._redis.zrevrange(key, start, end, withscores=True)
        result: list[LeaderboardEntry] = []
        for i, (member, score) in enumerate(entries):
            result.append(
                LeaderboardEntry(
                    user_id=uuid.UUID(member.decode() if isinstance(member, bytes) else member),
                    score=float(score),
                    rank=start + i + 1,
                )
            )
        return result
