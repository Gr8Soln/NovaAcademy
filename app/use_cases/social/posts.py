"""Post use cases — create, delete, like, unlike, feed."""

from __future__ import annotations

import uuid

from app.domain.entities.notification import Notification, NotificationType
from app.domain.entities.point_transaction import (POINT_VALUES, PointAction,
                                                   PointTransaction)
from app.domain.entities.post import Post, PostLike
from app.domain.exceptions import (AlreadyLikedError, AuthorizationError,
                                   PointCapReachedError, PostNotFoundError)
from app.interfaces.repositories.follow_repository import IFollowRepository
from app.interfaces.repositories.notification_repository import \
    INotificationRepository
from app.interfaces.repositories.point_transaction_repository import \
    IPointTransactionRepository
from app.interfaces.repositories.post_repository import IPostRepository
from app.interfaces.services.leaderboard_service import (ILeaderboardService,
                                                         LeaderboardType)
from app.interfaces.services.notification_push_service import \
    INotificationPushService


class CreatePostUseCase:
    def __init__(
        self,
        post_repo: IPostRepository,
        point_repo: IPointTransactionRepository,
        follow_repo: IFollowRepository,
        notification_repo: INotificationRepository,
        leaderboard_service: ILeaderboardService,
        notification_push: INotificationPushService,
    ) -> None:
        self._post_repo = post_repo
        self._point_repo = point_repo
        self._follow_repo = follow_repo
        self._notification_repo = notification_repo
        self._leaderboard = leaderboard_service
        self._notification_push = notification_push

    async def execute(self, user_id: uuid.UUID, content: str, user_name: str = "") -> Post:
        post = Post.create_manual(user_id, content)
        result = await self._post_repo.create(post)

        # Check first post milestone
        post_count = await self._post_repo.count_user_posts(user_id)
        if post_count == 1:
            bonus = POINT_VALUES[PointAction.FIRST_POST]
            await self._point_repo.create(PointTransaction(
                user_id=user_id, action=PointAction.FIRST_POST,
                points=bonus, description="Posted your first update!",
                reference_id=result.id,
            ))
            await self._leaderboard.increment_score(user_id, LeaderboardType.POINTS, bonus)

        # Notify followers
        followers = await self._follow_repo.get_followers(user_id, offset=0, limit=10000)
        for f in followers:
            notification = Notification(
                user_id=f.follower_id,
                type=NotificationType.NEW_POST,
                title="New post",
                message=f"{user_name or 'Someone you follow'} posted: \"{content[:80]}{'...' if len(content) > 80 else ''}\"",
                data={"post_id": str(result.id), "author_id": str(user_id)},
            )
            await self._notification_repo.create(notification)
            await self._notification_push.push(notification)

        return result


class DeletePostUseCase:
    def __init__(self, post_repo: IPostRepository) -> None:
        self._post_repo = post_repo

    async def execute(self, post_id: uuid.UUID, user_id: uuid.UUID) -> None:
        post = await self._post_repo.get_by_id(post_id)
        if not post:
            raise PostNotFoundError("Post not found")
        if post.user_id != user_id:
            raise AuthorizationError("Cannot delete another user's post")
        await self._post_repo.delete(post_id)


class LikePostUseCase:
    DAILY_LIKE_POINT_CAP = 10

    def __init__(
        self,
        post_repo: IPostRepository,
        point_repo: IPointTransactionRepository,
        notification_repo: INotificationRepository,
        leaderboard_service: ILeaderboardService,
        notification_push: INotificationPushService,
    ) -> None:
        self._post_repo = post_repo
        self._point_repo = point_repo
        self._notification_repo = notification_repo
        self._leaderboard = leaderboard_service
        self._notification_push = notification_push

    async def execute(self, post_id: uuid.UUID, user_id: uuid.UUID, user_name: str = "") -> None:
        post = await self._post_repo.get_by_id(post_id)
        if not post:
            raise PostNotFoundError("Post not found")

        existing = await self._post_repo.get_like(post_id, user_id)
        if existing:
            raise AlreadyLikedError("Already liked this post")

        like = PostLike(post_id=post_id, user_id=user_id)
        await self._post_repo.add_like(like)

        # Award point to post author (if not self-liking, and under daily cap)
        if post.user_id != user_id:
            daily_count = await self._point_repo.count_action_today(post.user_id, PointAction.POST_LIKED)
            if daily_count < self.DAILY_LIKE_POINT_CAP:
                pts = POINT_VALUES[PointAction.POST_LIKED]
                await self._point_repo.create(PointTransaction(
                    user_id=post.user_id, action=PointAction.POST_LIKED,
                    points=pts, description="Someone liked your post",
                    reference_id=post_id,
                ))
                await self._leaderboard.increment_score(post.user_id, LeaderboardType.POINTS, pts)

            # Notify
            notification = Notification(
                user_id=post.user_id,
                type=NotificationType.POST_LIKE,
                title="Post liked",
                message=f"{user_name or 'Someone'} liked your post",
                data={"post_id": str(post_id), "liker_id": str(user_id)},
            )
            await self._notification_repo.create(notification)
            await self._notification_push.push(notification)


class UnlikePostUseCase:
    def __init__(self, post_repo: IPostRepository) -> None:
        self._post_repo = post_repo

    async def execute(self, post_id: uuid.UUID, user_id: uuid.UUID) -> None:
        post = await self._post_repo.get_by_id(post_id)
        if not post:
            raise PostNotFoundError("Post not found")
        await self._post_repo.remove_like(post_id, user_id)


class GetFeedUseCase:
    def __init__(self, post_repo: IPostRepository, follow_repo: IFollowRepository) -> None:
        self._post_repo = post_repo
        self._follow_repo = follow_repo

    async def execute(self, user_id: uuid.UUID, offset: int = 0, limit: int = 20) -> list[Post]:
        following = await self._follow_repo.get_following(user_id, offset=0, limit=10000)
        following_ids = [f.following_id for f in following]
        # Include own posts in the feed
        following_ids.append(user_id)
        posts = await self._post_repo.get_feed(following_ids, offset=offset, limit=limit)
        # Record impressions
        for p in posts:
            await self._post_repo.increment_impressions(p.id)
        return posts


class GetExploreUseCase:
    def __init__(self, post_repo: IPostRepository) -> None:
        self._post_repo = post_repo

    async def execute(self, offset: int = 0, limit: int = 20) -> list[Post]:
        posts = await self._post_repo.get_explore(offset=offset, limit=limit)
        for p in posts:
            await self._post_repo.increment_impressions(p.id)
        return posts
