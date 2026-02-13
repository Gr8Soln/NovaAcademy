"""Points use cases — award, deduct, check balance, history."""

from __future__ import annotations

import uuid

from app.domain.entities.point_transaction import (POINT_VALUES, PointAction,
                                                   PointTransaction)
from app.domain.exceptions import InsufficientPointsError
from app.interfaces.repositories.point_transaction_repository import \
    IPointTransactionRepository
from app.interfaces.services.leaderboard_service import (ILeaderboardService,
                                                         LeaderboardType)


class AwardPointsUseCase:
    DAILY_QA_CAP = 20  # max points from Q&A per day

    def __init__(
        self,
        point_repo: IPointTransactionRepository,
        leaderboard_service: ILeaderboardService,
    ) -> None:
        self._point_repo = point_repo
        self._leaderboard = leaderboard_service

    async def execute(
        self,
        user_id: uuid.UUID,
        action: PointAction,
        description: str = "",
        reference_id: uuid.UUID | None = None,
        custom_points: int | None = None,
    ) -> PointTransaction | None:
        """Award points for an action. Returns None if capped."""
        # Anti-gaming: daily Q&A cap
        if action == PointAction.ASK_QUESTION:
            daily_count = await self._point_repo.count_action_today(user_id, action)
            if daily_count * POINT_VALUES[action] >= self.DAILY_QA_CAP:
                return None

        pts = custom_points if custom_points is not None else POINT_VALUES.get(action, 0)
        if pts <= 0:
            return None

        txn = PointTransaction(
            user_id=user_id,
            action=action,
            points=pts,
            description=description or action.value,
            reference_id=reference_id,
        )
        result = await self._point_repo.create(txn)
        await self._leaderboard.increment_score(user_id, LeaderboardType.POINTS, pts)
        return result


class DeductPointsUseCase:
    def __init__(self, point_repo: IPointTransactionRepository, leaderboard_service: ILeaderboardService) -> None:
        self._point_repo = point_repo
        self._leaderboard = leaderboard_service

    async def execute(
        self,
        user_id: uuid.UUID,
        action: PointAction,
        points: int,
        description: str = "",
        reference_id: uuid.UUID | None = None,
    ) -> PointTransaction:
        balance = await self._point_repo.get_balance(user_id)
        if balance < points:
            raise InsufficientPointsError(f"Insufficient points: have {balance}, need {points}")

        txn = PointTransaction(
            user_id=user_id,
            action=action,
            points=-abs(points),
            description=description or action.value,
            reference_id=reference_id,
        )
        result = await self._point_repo.create(txn)
        await self._leaderboard.increment_score(user_id, LeaderboardType.POINTS, -abs(points))
        return result


class GetPointsBalanceUseCase:
    def __init__(self, point_repo: IPointTransactionRepository) -> None:
        self._point_repo = point_repo

    async def execute(self, user_id: uuid.UUID) -> int:
        return await self._point_repo.get_balance(user_id)


class GetPointsHistoryUseCase:
    def __init__(self, point_repo: IPointTransactionRepository) -> None:
        self._point_repo = point_repo

    async def execute(self, user_id: uuid.UUID, offset: int = 0, limit: int = 20) -> list[PointTransaction]:
        return await self._point_repo.get_history(user_id, offset=offset, limit=limit)
