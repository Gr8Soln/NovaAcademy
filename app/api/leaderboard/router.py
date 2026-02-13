"""Leaderboard API router — rankings by points and study time."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, get_leaderboard_service
from app.domain.entities.user import User
from app.interfaces.services.leaderboard_service import (ILeaderboardService,
                                                         LeaderboardPeriod,
                                                         LeaderboardType)
from app.schemas.social import LeaderboardEntryResponse
from app.use_cases.challenges import GetLeaderboardUseCase, GetUserRankUseCase

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("/{board_type}/{period}", response_model=list[LeaderboardEntryResponse])
async def get_leaderboard(
    board_type: str,
    period: str,
    limit: int = 100,
    _: User = Depends(get_current_user),
    leaderboard: ILeaderboardService = Depends(get_leaderboard_service),
):
    use_case = GetLeaderboardUseCase(leaderboard)
    entries = await use_case.execute(
        board_type=LeaderboardType(board_type),
        period=LeaderboardPeriod(period),
        limit=limit,
    )
    return [
        LeaderboardEntryResponse(user_id=e.user_id, score=e.score, rank=e.rank) for e in entries
    ]


@router.get("/{board_type}/{period}/me", response_model=LeaderboardEntryResponse | None)
async def get_my_rank(
    board_type: str,
    period: str,
    current_user: User = Depends(get_current_user),
    leaderboard: ILeaderboardService = Depends(get_leaderboard_service),
):
    use_case = GetUserRankUseCase(leaderboard)
    entry = await use_case.execute(
        user_id=current_user.id,
        board_type=LeaderboardType(board_type),
        period=LeaderboardPeriod(period),
    )
    if not entry:
        return None
    return LeaderboardEntryResponse(user_id=entry.user_id, score=entry.score, rank=entry.rank)


@router.get("/{board_type}/{period}/around/{user_id}", response_model=list[LeaderboardEntryResponse])
async def get_around_user(
    board_type: str,
    period: str,
    user_id: uuid.UUID,
    count: int = 5,
    _: User = Depends(get_current_user),
    leaderboard: ILeaderboardService = Depends(get_leaderboard_service),
):
    entries = await leaderboard.get_around_user(
        user_id=user_id,
        board_type=LeaderboardType(board_type),
        period=LeaderboardPeriod(period),
        count=count,
    )
    return [
        LeaderboardEntryResponse(user_id=e.user_id, score=e.score, rank=e.rank) for e in entries
    ]
