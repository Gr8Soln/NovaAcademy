"""Posts API router — student tweets: create, feed, explore, like."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import (get_current_user, get_follow_repository,
                                   get_leaderboard_service,
                                   get_notification_push_service,
                                   get_notification_repository,
                                   get_point_transaction_repository,
                                   get_post_repository)
from app.domain.entities.user import User
from app.domain.exceptions import AlreadyLikedError, PostNotFoundError
from app.interfaces.repositories.follow_repository import IFollowRepository
from app.interfaces.repositories.notification_repository import \
    INotificationRepository
from app.interfaces.repositories.point_transaction_repository import \
    IPointTransactionRepository
from app.interfaces.repositories.post_repository import IPostRepository
from app.interfaces.services.leaderboard_service import ILeaderboardService
from app.interfaces.services.notification_push_service import \
    INotificationPushService
from app.schemas.social import CreatePostRequest, PostResponse
from app.use_cases.social import (CreatePostUseCase, DeletePostUseCase,
                                  GetExploreUseCase, GetFeedUseCase,
                                  LikePostUseCase, UnlikePostUseCase)

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post("/", response_model=PostResponse, status_code=201)
async def create_post(
    body: CreatePostRequest,
    current_user: User = Depends(get_current_user),
    post_repo: IPostRepository = Depends(get_post_repository),
    follow_repo: IFollowRepository = Depends(get_follow_repository),
    notification_repo: INotificationRepository = Depends(get_notification_repository),
    point_repo: IPointTransactionRepository = Depends(get_point_transaction_repository),
    leaderboard: ILeaderboardService = Depends(get_leaderboard_service),
    push: INotificationPushService = Depends(get_notification_push_service),
):
    use_case = CreatePostUseCase(post_repo, follow_repo, notification_repo, point_repo, leaderboard, push)
    try:
        post = await use_case.execute(user_id=current_user.id, content=body.content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return PostResponse(
        id=post.id, user_id=post.user_id, content=post.content,
        post_type=post.post_type.value, like_count=post.like_count,
        impression_count=post.impression_count, created_at=post.created_at,
    )


@router.delete("/{post_id}", status_code=204)
async def delete_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    post_repo: IPostRepository = Depends(get_post_repository),
):
    use_case = DeletePostUseCase(post_repo)
    try:
        await use_case.execute(post_id=post_id, user_id=current_user.id)
    except PostNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/feed", response_model=list[PostResponse])
async def get_feed(
    offset: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    post_repo: IPostRepository = Depends(get_post_repository),
    follow_repo: IFollowRepository = Depends(get_follow_repository),
):
    use_case = GetFeedUseCase(post_repo, follow_repo)
    posts = await use_case.execute(user_id=current_user.id, offset=offset, limit=limit)
    return [
        PostResponse(
            id=p.id, user_id=p.user_id, content=p.content,
            post_type=p.post_type.value, like_count=p.like_count,
            impression_count=p.impression_count, created_at=p.created_at,
        )
        for p in posts
    ]


@router.get("/explore", response_model=list[PostResponse])
async def get_explore(
    offset: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    post_repo: IPostRepository = Depends(get_post_repository),
):
    use_case = GetExploreUseCase(post_repo)
    posts = await use_case.execute(offset=offset, limit=limit)
    return [
        PostResponse(
            id=p.id, user_id=p.user_id, content=p.content,
            post_type=p.post_type.value, like_count=p.like_count,
            impression_count=p.impression_count, created_at=p.created_at,
        )
        for p in posts
    ]


@router.post("/{post_id}/like", status_code=204)
async def like_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    post_repo: IPostRepository = Depends(get_post_repository),
    notification_repo: INotificationRepository = Depends(get_notification_repository),
    point_repo: IPointTransactionRepository = Depends(get_point_transaction_repository),
    leaderboard: ILeaderboardService = Depends(get_leaderboard_service),
    push: INotificationPushService = Depends(get_notification_push_service),
):
    use_case = LikePostUseCase(post_repo, notification_repo, point_repo, leaderboard, push)
    try:
        await use_case.execute(post_id=post_id, user_id=current_user.id)
    except PostNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except AlreadyLikedError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.delete("/{post_id}/like", status_code=204)
async def unlike_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    post_repo: IPostRepository = Depends(get_post_repository),
):
    use_case = UnlikePostUseCase(post_repo)
    await use_case.execute(post_id=post_id, user_id=current_user.id)
