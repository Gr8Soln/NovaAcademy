"""Postgres follow repository implementation."""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import and_, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.follow import Follow
from app.infrastructure.db.mappers import (follow_entity_to_model,
                                           follow_model_to_entity)
from app.infrastructure.db.models import FollowModel
from app.interfaces.repositories.follow_repository import IFollowRepository


class PostgresFollowRepository(IFollowRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, follow: Follow) -> Follow:
        model = follow_entity_to_model(follow)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return follow_model_to_entity(model)

    async def delete(self, follower_id: uuid.UUID, following_id: uuid.UUID) -> None:
        await self._session.execute(
            delete(FollowModel).where(
                and_(
                    FollowModel.follower_id == follower_id,
                    FollowModel.following_id == following_id,
                )
            )
        )
        await self._session.flush()

    async def get(self, follower_id: uuid.UUID, following_id: uuid.UUID) -> Optional[Follow]:
        result = await self._session.execute(
            select(FollowModel).where(
                and_(
                    FollowModel.follower_id == follower_id,
                    FollowModel.following_id == following_id,
                )
            )
        )
        model = result.scalar_one_or_none()
        return follow_model_to_entity(model) if model else None

    async def get_followers(self, user_id: uuid.UUID, offset: int = 0, limit: int = 20) -> list[Follow]:
        result = await self._session.execute(
            select(FollowModel)
            .where(FollowModel.following_id == user_id)
            .order_by(FollowModel.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return [follow_model_to_entity(m) for m in result.scalars().all()]

    async def get_following(self, user_id: uuid.UUID, offset: int = 0, limit: int = 20) -> list[Follow]:
        result = await self._session.execute(
            select(FollowModel)
            .where(FollowModel.follower_id == user_id)
            .order_by(FollowModel.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return [follow_model_to_entity(m) for m in result.scalars().all()]

    async def count_followers(self, user_id: uuid.UUID) -> int:
        result = await self._session.execute(
            select(func.count()).where(FollowModel.following_id == user_id)
        )
        return result.scalar() or 0

    async def count_following(self, user_id: uuid.UUID) -> int:
        result = await self._session.execute(
            select(func.count()).where(FollowModel.follower_id == user_id)
        )
        return result.scalar() or 0

    async def is_mutual(self, user_a: uuid.UUID, user_b: uuid.UUID) -> bool:
        # Check both directions exist
        result = await self._session.execute(
            select(func.count()).where(
                and_(
                    FollowModel.follower_id.in_([user_a, user_b]),
                    FollowModel.following_id.in_([user_a, user_b]),
                )
            )
        )
        return (result.scalar() or 0) >= 2
