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
from app.schemas.response import paginated_response, success_response
from app.schemas.social import CreatePostRequest, PostResponse
from app.use_cases.social import (CreatePostUseCase, DeletePostUseCase,
                                  GetExploreUseCase, GetFeedUseCase,
                                  LikePostUseCase, UnlikePostUseCase)

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post("/", status_code=201)
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
    use_case = CreatePostUseCase(post_repo, point_repo, follow_repo, notification_repo, leaderboard, push)
    try:
        post = await use_case.execute(user_id=current_user.id, content=body.content, user_name=current_user.full_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return success_response(
        data=PostResponse(
            id=post.id, user_id=post.user_id, content=post.content,
            post_type=post.post_type.value, like_count=post.like_count,
            impression_count=post.impression_count, created_at=post.created_at,
        ).model_dump(mode="json"),
        message="Post created",
    )


@router.delete("/{post_id}")
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
    return success_response(message="Post deleted")


@router.get("/feed")
async def get_feed(
    offset: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    post_repo: IPostRepository = Depends(get_post_repository),
    follow_repo: IFollowRepository = Depends(get_follow_repository),
):
    use_case = GetFeedUseCase(post_repo, follow_repo)
    posts = await use_case.execute(user_id=current_user.id, offset=offset, limit=limit)
    following = await follow_repo.get_following(current_user.id, offset=0, limit=10000)
    following_ids = [f.following_id for f in following]
    total = await post_repo.count_feed(following_ids)
    return paginated_response(
        data=[
            PostResponse(
                id=p.id, user_id=p.user_id, content=p.content,
                post_type=p.post_type.value, like_count=p.like_count,
                impression_count=p.impression_count, created_at=p.created_at,
            ).model_dump(mode="json")
            for p in posts
        ],
        message="Feed retrieved",
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get("/explore")
async def get_explore(
    offset: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    post_repo: IPostRepository = Depends(get_post_repository),
):
    use_case = GetExploreUseCase(post_repo)
    posts = await use_case.execute(offset=offset, limit=limit)
    total = await post_repo.count_explore()
    return paginated_response(
        data=[
            PostResponse(
                id=p.id, user_id=p.user_id, content=p.content,
                post_type=p.post_type.value, like_count=p.like_count,
                impression_count=p.impression_count, created_at=p.created_at,
            ).model_dump(mode="json")
            for p in posts
        ],
        message="Explore posts retrieved",
        total=total,
        offset=offset,
        limit=limit,
    )


@router.post("/{post_id}/like")
async def like_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    post_repo: IPostRepository = Depends(get_post_repository),
    notification_repo: INotificationRepository = Depends(get_notification_repository),
    point_repo: IPointTransactionRepository = Depends(get_point_transaction_repository),
    leaderboard: ILeaderboardService = Depends(get_leaderboard_service),
    push: INotificationPushService = Depends(get_notification_push_service),
):
    use_case = LikePostUseCase(post_repo, point_repo, notification_repo, leaderboard, push)
    try:
        await use_case.execute(post_id=post_id, user_id=current_user.id, user_name=current_user.full_name)
    except PostNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except AlreadyLikedError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return success_response(message="Post liked")


@router.delete("/{post_id}/like")
async def unlike_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    post_repo: IPostRepository = Depends(get_post_repository),
):
    use_case = UnlikePostUseCase(post_repo)
    await use_case.execute(post_id=post_id, user_id=current_user.id)
    return success_response(message="Post unliked")


@router.get("/user/{user_id}")
async def get_user_posts(
    user_id: uuid.UUID,
    offset: int = 0,
    limit: int = 20,
    _: User = Depends(get_current_user),
    post_repo: IPostRepository = Depends(get_post_repository),
):
    """Get posts by a specific user (for profile view)."""
    posts = await post_repo.get_user_posts(user_id, offset=offset, limit=limit)
    total = await post_repo.count_user_posts(user_id)
    return paginated_response(
        data=[
            PostResponse(
                id=p.id, user_id=p.user_id, content=p.content,
                post_type=p.post_type.value, like_count=p.like_count,
                impression_count=p.impression_count, created_at=p.created_at,
            ).model_dump(mode="json")
            for p in posts
        ],
        message="User posts retrieved",
        total=total,
        offset=offset,
        limit=limit,
    )
