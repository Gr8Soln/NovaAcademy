"""Leaderboard use cases — get rankings."""

from __future__ import annotations

import uuid

from app.interfaces.services.leaderboard_service import (ILeaderboardService,
                                                         LeaderboardEntry,
                                                         LeaderboardPeriod,
                                                         LeaderboardType)


class GetLeaderboardUseCase:
    def __init__(self, leaderboard_service: ILeaderboardService) -> None:
        self._leaderboard = leaderboard_service

    async def execute(
        self,
        board_type: LeaderboardType,
        period: LeaderboardPeriod,
        limit: int = 100,
    ) -> list[LeaderboardEntry]:
        return await self._leaderboard.get_top(board_type, period, limit=limit)


class GetUserRankUseCase:
    def __init__(self, leaderboard_service: ILeaderboardService) -> None:
        self._leaderboard = leaderboard_service

    async def execute(
        self,
        user_id: uuid.UUID,
        board_type: LeaderboardType,
        period: LeaderboardPeriod,
    ) -> LeaderboardEntry | None:
        return await self._leaderboard.get_rank(user_id, board_type, period)
