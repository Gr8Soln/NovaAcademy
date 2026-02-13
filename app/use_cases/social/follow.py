"""Follow / Unfollow use case."""

from __future__ import annotations

import uuid

from app.domain.entities.follow import Follow
from app.domain.entities.notification import Notification, NotificationType
from app.domain.entities.point_transaction import (POINT_VALUES, PointAction,
                                                   PointTransaction)
from app.domain.exceptions import (AlreadyFollowingError, NotFollowingError,
                                   UserNotFoundError)
from app.interfaces.repositories.follow_repository import IFollowRepository
from app.interfaces.repositories.notification_repository import \
    INotificationRepository
from app.interfaces.repositories.point_transaction_repository import \
    IPointTransactionRepository
from app.interfaces.repositories.user_repository import IUserRepository
from app.interfaces.services.leaderboard_service import (ILeaderboardService,
                                                         LeaderboardType)
from app.interfaces.services.notification_push_service import \
    INotificationPushService


class FollowUserUseCase:
    def __init__(
        self,
        follow_repo: IFollowRepository,
        user_repo: IUserRepository,
        point_repo: IPointTransactionRepository,
        notification_repo: INotificationRepository,
        leaderboard_service: ILeaderboardService,
        notification_push: INotificationPushService,
    ) -> None:
        self._follow_repo = follow_repo
        self._user_repo = user_repo
        self._point_repo = point_repo
        self._notification_repo = notification_repo
        self._leaderboard = leaderboard_service
        self._notification_push = notification_push

    async def execute(self, follower_id: uuid.UUID, following_id: uuid.UUID) -> Follow:
        if follower_id == following_id:
            raise ValueError("Cannot follow yourself")

        target = await self._user_repo.get_by_id(following_id)
        if not target:
            raise UserNotFoundError("User to follow not found")

        existing = await self._follow_repo.get(follower_id, following_id)
        if existing:
            raise AlreadyFollowingError("Already following this user")

        follow = Follow(follower_id=follower_id, following_id=following_id)
        result = await self._follow_repo.create(follow)

        # Award points to the followed user
        pts = POINT_VALUES[PointAction.GAINED_FOLLOWER]
        txn = PointTransaction(
            user_id=following_id,
            action=PointAction.GAINED_FOLLOWER,
            points=pts,
            description=f"Gained a new follower",
            reference_id=follower_id,
        )
        await self._point_repo.create(txn)
        await self._leaderboard.increment_score(following_id, LeaderboardType.POINTS, pts)

        # Check follower milestones
        follower_count = await self._follow_repo.count_followers(following_id)
        if follower_count == 10:
            bonus = POINT_VALUES[PointAction.FOLLOWER_MILESTONE_10]
            await self._point_repo.create(PointTransaction(
                user_id=following_id, action=PointAction.FOLLOWER_MILESTONE_10,
                points=bonus, description="Reached 10 followers milestone!",
            ))
            await self._leaderboard.increment_score(following_id, LeaderboardType.POINTS, bonus)
        elif follower_count == 50:
            bonus = POINT_VALUES[PointAction.FOLLOWER_MILESTONE_50]
            await self._point_repo.create(PointTransaction(
                user_id=following_id, action=PointAction.FOLLOWER_MILESTONE_50,
                points=bonus, description="Reached 50 followers milestone!",
            ))
            await self._leaderboard.increment_score(following_id, LeaderboardType.POINTS, bonus)

        # Notify
        follower = await self._user_repo.get_by_id(follower_id)
        notification = Notification(
            user_id=following_id,
            type=NotificationType.NEW_FOLLOWER,
            title="New follower",
            message=f"{follower.full_name if follower else 'Someone'} started following you",
            data={"follower_id": str(follower_id)},
        )
        await self._notification_repo.create(notification)
        await self._notification_push.push(notification)

        return result


class UnfollowUserUseCase:
    def __init__(self, follow_repo: IFollowRepository) -> None:
        self._follow_repo = follow_repo

    async def execute(self, follower_id: uuid.UUID, following_id: uuid.UUID) -> None:
        existing = await self._follow_repo.get(follower_id, following_id)
        if not existing:
            raise NotFollowingError("Not following this user")
        await self._follow_repo.delete(follower_id, following_id)
