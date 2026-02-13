"""Postgres post repository implementation."""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import and_, delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.post import Post, PostLike
from app.infrastructure.db.mappers import (post_entity_to_model,
                                           post_like_entity_to_model,
                                           post_like_model_to_entity,
                                           post_model_to_entity)
from app.infrastructure.db.models import PostLikeModel, PostModel
from app.interfaces.repositories.post_repository import IPostRepository


class PostgresPostRepository(IPostRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, post: Post) -> Post:
        model = post_entity_to_model(post)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return post_model_to_entity(model)

    async def get_by_id(self, post_id: uuid.UUID) -> Optional[Post]:
        result = await self._session.execute(select(PostModel).where(PostModel.id == post_id))
        model = result.scalar_one_or_none()
        return post_model_to_entity(model) if model else None

    async def delete(self, post_id: uuid.UUID) -> None:
        result = await self._session.execute(select(PostModel).where(PostModel.id == post_id))
        model = result.scalar_one_or_none()
        if model:
            await self._session.delete(model)
            await self._session.flush()

    async def get_feed(
        self, following_ids: list[uuid.UUID], offset: int = 0, limit: int = 20
    ) -> list[Post]:
        result = await self._session.execute(
            select(PostModel)
            .where(PostModel.user_id.in_(following_ids))
            .order_by(PostModel.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return [post_model_to_entity(m) for m in result.scalars().all()]

    async def get_explore(self, offset: int = 0, limit: int = 20) -> list[Post]:
        result = await self._session.execute(
            select(PostModel)
            .order_by(PostModel.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return [post_model_to_entity(m) for m in result.scalars().all()]

    async def get_user_posts(self, user_id: uuid.UUID, offset: int = 0, limit: int = 20) -> list[Post]:
        result = await self._session.execute(
            select(PostModel)
            .where(PostModel.user_id == user_id)
            .order_by(PostModel.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return [post_model_to_entity(m) for m in result.scalars().all()]

    async def increment_impressions(self, post_id: uuid.UUID) -> None:
        await self._session.execute(
            update(PostModel)
            .where(PostModel.id == post_id)
            .values(impression_count=PostModel.impression_count + 1)
        )
        await self._session.flush()

    async def like(self, like: PostLike) -> PostLike:
        model = post_like_entity_to_model(like)
        self._session.add(model)
        # Also increment the post's like_count
        await self._session.execute(
            update(PostModel)
            .where(PostModel.id == like.post_id)
            .values(like_count=PostModel.like_count + 1)
        )
        await self._session.flush()
        await self._session.refresh(model)
        return post_like_model_to_entity(model)

    async def unlike(self, post_id: uuid.UUID, user_id: uuid.UUID) -> None:
        await self._session.execute(
            delete(PostLikeModel).where(
                and_(PostLikeModel.post_id == post_id, PostLikeModel.user_id == user_id)
            )
        )
        # Decrement the post's like_count
        await self._session.execute(
            update(PostModel)
            .where(and_(PostModel.id == post_id, PostModel.like_count > 0))
            .values(like_count=PostModel.like_count - 1)
        )
        await self._session.flush()

    async def has_liked(self, post_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        result = await self._session.execute(
            select(func.count()).where(
                and_(PostLikeModel.post_id == post_id, PostLikeModel.user_id == user_id)
            )
        )
        return (result.scalar() or 0) > 0

    async def count_user_posts(self, user_id: uuid.UUID) -> int:
        result = await self._session.execute(
            select(func.count()).where(PostModel.user_id == user_id)
        )
        return result.scalar() or 0

    async def count_feed(self, following_ids: list[uuid.UUID]) -> int:
        if not following_ids:
            return 0
        result = await self._session.execute(
            select(func.count()).select_from(PostModel).where(PostModel.user_id.in_(following_ids))
        )
        return result.scalar() or 0

    async def count_explore(self) -> int:
        result = await self._session.execute(
            select(func.count()).select_from(PostModel)
        )
        return result.scalar() or 0
