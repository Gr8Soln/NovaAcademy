"""Postgres challenge repository implementation."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.challenge import Challenge, ChallengeStatus
from app.infrastructure.db.mappers import (challenge_entity_to_model,
                                           challenge_model_to_entity)
from app.infrastructure.db.models import ChallengeModel
from app.interfaces.repositories.challenge_repository import \
    IChallengeRepository


class PostgresChallengeRepository(IChallengeRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, challenge: Challenge) -> Challenge:
        model = challenge_entity_to_model(challenge)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return challenge_model_to_entity(model)

    async def get_by_id(self, challenge_id: uuid.UUID) -> Optional[Challenge]:
        result = await self._session.execute(
            select(ChallengeModel).where(ChallengeModel.id == challenge_id)
        )
        model = result.scalar_one_or_none()
        return challenge_model_to_entity(model) if model else None

    async def update(self, challenge: Challenge) -> Challenge:
        result = await self._session.execute(
            select(ChallengeModel).where(ChallengeModel.id == challenge.id)
        )
        model = result.scalar_one_or_none()
        if model:
            model.status = challenge.status.value
            model.quiz_id = challenge.quiz_id
            model.challenger_score = challenge.challenger_score
            model.opponent_score = challenge.opponent_score
            model.winner_id = challenge.winner_id
            model.completed_at = challenge.completed_at
            model.updated_at = challenge.updated_at
            await self._session.flush()
            await self._session.refresh(model)
            return challenge_model_to_entity(model)
        return challenge

    async def get_user_challenges(
        self,
        user_id: uuid.UUID,
        status: Optional[ChallengeStatus] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[Challenge]:
        stmt = select(ChallengeModel).where(
            or_(
                ChallengeModel.challenger_id == user_id,
                ChallengeModel.opponent_id == user_id,
            )
        )
        if status:
            stmt = stmt.where(ChallengeModel.status == status.value)
        stmt = stmt.order_by(ChallengeModel.created_at.desc()).offset(offset)
        if limit > 0:
            stmt = stmt.limit(limit)
        result = await self._session.execute(stmt)
        return [challenge_model_to_entity(m) for m in result.scalars().all()]

    async def count_daily_challenges(
        self, challenger_id: uuid.UUID, opponent_id: uuid.UUID, date: datetime
    ) -> int:
        start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start.replace(hour=23, minute=59, second=59)
        result = await self._session.execute(
            select(func.count()).where(
                and_(
                    ChallengeModel.challenger_id == challenger_id,
                    ChallengeModel.opponent_id == opponent_id,
                    ChallengeModel.created_at >= start,
                    ChallengeModel.created_at <= end,
                )
            )
        )
        return result.scalar() or 0

    async def get_expired_challenges(self) -> list[Challenge]:
        now = datetime.utcnow()
        result = await self._session.execute(
            select(ChallengeModel).where(
                and_(
                    ChallengeModel.expires_at < now,
                    ChallengeModel.status.in_(["pending", "accepted", "in_progress"]),
                )
            )
        )
        return [challenge_model_to_entity(m) for m in result.scalars().all()]
