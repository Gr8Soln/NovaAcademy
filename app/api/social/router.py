"""Follow API router — follow / unfollow users."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import (get_current_user, get_follow_repository,
                                   get_leaderboard_service,
                                   get_notification_push_service,
                                   get_notification_repository,
                                   get_point_transaction_repository,
                                   get_user_repository)
from app.domain.entities.user import User
from app.domain.exceptions import (AlreadyFollowingError, NotFollowingError,
                                   UserNotFoundError)
from app.interfaces.repositories.follow_repository import IFollowRepository
from app.interfaces.repositories.notification_repository import \
    INotificationRepository
from app.interfaces.repositories.point_transaction_repository import \
    IPointTransactionRepository
from app.interfaces.repositories.user_repository import IUserRepository
from app.interfaces.services.leaderboard_service import ILeaderboardService
from app.interfaces.services.notification_push_service import \
    INotificationPushService
from app.schemas.response import paginated_response, success_response
from app.schemas.social import FollowResponse, FollowStatsResponse
from app.use_cases.social import FollowUserUseCase, UnfollowUserUseCase

router = APIRouter(prefix="/social", tags=["social"])


@router.post("/follow/{user_id}")
async def follow_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    follow_repo: IFollowRepository = Depends(get_follow_repository),
    user_repo: IUserRepository = Depends(get_user_repository),
    notification_repo: INotificationRepository = Depends(get_notification_repository),
    point_repo: IPointTransactionRepository = Depends(get_point_transaction_repository),
    leaderboard: ILeaderboardService = Depends(get_leaderboard_service),
    push: INotificationPushService = Depends(get_notification_push_service),
):
    use_case = FollowUserUseCase(follow_repo, user_repo, point_repo, notification_repo, leaderboard, push)
    try:
        follow = await use_case.execute(follower_id=current_user.id, following_id=user_id)
    except AlreadyFollowingError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return success_response(
        data=FollowResponse(
            id=follow.id,
            follower_id=follow.follower_id,
            following_id=follow.following_id,
            created_at=follow.created_at,
        ).model_dump(mode="json"),
        message="User followed",
    )


@router.delete("/unfollow/{user_id}")
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
    return success_response(message="User unfollowed")


@router.get("/followers/{user_id}")
async def list_followers(
    user_id: uuid.UUID,
    offset: int = 0,
    limit: int = 20,
    follow_repo: IFollowRepository = Depends(get_follow_repository),
    _: User = Depends(get_current_user),
):
    follows = await follow_repo.get_followers(user_id, offset=offset, limit=limit)
    total = await follow_repo.count_followers(user_id)
    return paginated_response(
        data=[
            FollowResponse(
                id=f.id, follower_id=f.follower_id, following_id=f.following_id, created_at=f.created_at
            ).model_dump(mode="json")
            for f in follows
        ],
        message="Followers retrieved",
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get("/following/{user_id}")
async def list_following(
    user_id: uuid.UUID,
    offset: int = 0,
    limit: int = 20,
    follow_repo: IFollowRepository = Depends(get_follow_repository),
    _: User = Depends(get_current_user),
):
    follows = await follow_repo.get_following(user_id, offset=offset, limit=limit)
    total = await follow_repo.count_following(user_id)
    return paginated_response(
        data=[
            FollowResponse(
                id=f.id, follower_id=f.follower_id, following_id=f.following_id, created_at=f.created_at
            ).model_dump(mode="json")
            for f in follows
        ],
        message="Following retrieved",
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get("/follow-stats/{user_id}")
async def get_follow_stats(
    user_id: uuid.UUID,
    follow_repo: IFollowRepository = Depends(get_follow_repository),
    _: User = Depends(get_current_user),
):
    followers = await follow_repo.count_followers(user_id)
    following = await follow_repo.count_following(user_id)
    return success_response(
        data=FollowStatsResponse(followers_count=followers, following_count=following).model_dump(mode="json"),
        message="Follow stats retrieved",
    )
