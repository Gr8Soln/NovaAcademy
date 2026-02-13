"""Follow API router — follow / unfollow users."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import (get_current_user, get_follow_repository,
                                   get_leaderboard_service,
                                   get_notification_push_service,
                                   get_notification_repository,
                                   get_point_transaction_repository)
from app.domain.entities.user import User
from app.domain.exceptions import AlreadyFollowingError, NotFollowingError
from app.interfaces.repositories.follow_repository import IFollowRepository
from app.interfaces.repositories.notification_repository import \
    INotificationRepository
from app.interfaces.repositories.point_transaction_repository import \
    IPointTransactionRepository
from app.interfaces.services.leaderboard_service import ILeaderboardService
from app.interfaces.services.notification_push_service import \
    INotificationPushService
from app.schemas.social import FollowResponse, FollowStatsResponse
from app.use_cases.social import FollowUserUseCase, UnfollowUserUseCase

router = APIRouter(prefix="/social", tags=["social"])


@router.post("/follow/{user_id}", response_model=FollowResponse)
async def follow_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    follow_repo: IFollowRepository = Depends(get_follow_repository),
    notification_repo: INotificationRepository = Depends(get_notification_repository),
    point_repo: IPointTransactionRepository = Depends(get_point_transaction_repository),
    leaderboard: ILeaderboardService = Depends(get_leaderboard_service),
    push: INotificationPushService = Depends(get_notification_push_service),
):
    use_case = FollowUserUseCase(follow_repo, notification_repo, point_repo, leaderboard, push)
    try:
        follow = await use_case.execute(follower_id=current_user.id, following_id=user_id)
    except AlreadyFollowingError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return FollowResponse(
        id=follow.id,
        follower_id=follow.follower_id,
        following_id=follow.following_id,
        created_at=follow.created_at,
    )


@router.delete("/unfollow/{user_id}", status_code=204)
async def unfollow_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    follow_repo: IFollowRepository = Depends(get_follow_repository),
):
    use_case = UnfollowUserUseCase(follow_repo)
    try:
        await use_case.execute(follower_id=current_user.id, following_id=user_id)
    except NotFollowingError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/followers/{user_id}", response_model=list[FollowResponse])
async def list_followers(
    user_id: uuid.UUID,
    offset: int = 0,
    limit: int = 20,
    follow_repo: IFollowRepository = Depends(get_follow_repository),
    _: User = Depends(get_current_user),
):
    follows = await follow_repo.get_followers(user_id, offset=offset, limit=limit)
    return [
        FollowResponse(
            id=f.id, follower_id=f.follower_id, following_id=f.following_id, created_at=f.created_at
        )
        for f in follows
    ]


@router.get("/following/{user_id}", response_model=list[FollowResponse])
async def list_following(
    user_id: uuid.UUID,
    offset: int = 0,
    limit: int = 20,
    follow_repo: IFollowRepository = Depends(get_follow_repository),
    _: User = Depends(get_current_user),
):
    follows = await follow_repo.get_following(user_id, offset=offset, limit=limit)
    return [
        FollowResponse(
            id=f.id, follower_id=f.follower_id, following_id=f.following_id, created_at=f.created_at
        )
        for f in follows
    ]


@router.get("/follow-stats/{user_id}", response_model=FollowStatsResponse)
async def get_follow_stats(
    user_id: uuid.UUID,
    follow_repo: IFollowRepository = Depends(get_follow_repository),
    _: User = Depends(get_current_user),
):
    followers = await follow_repo.count_followers(user_id)
    following = await follow_repo.count_following(user_id)
    return FollowStatsResponse(followers_count=followers, following_count=following)
