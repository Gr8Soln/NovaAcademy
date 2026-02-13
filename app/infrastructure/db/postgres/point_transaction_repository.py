"""Postgres point transaction repository implementation."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.point_transaction import PointAction, PointTransaction
from app.infrastructure.db.mappers import (point_transaction_entity_to_model,
                                           point_transaction_model_to_entity)
from app.infrastructure.db.models import PointTransactionModel
from app.interfaces.repositories.point_transaction_repository import \
    IPointTransactionRepository


class PostgresPointTransactionRepository(IPointTransactionRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, transaction: PointTransaction) -> PointTransaction:
        model = point_transaction_entity_to_model(transaction)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return point_transaction_model_to_entity(model)

    async def get_balance(self, user_id: uuid.UUID) -> int:
        result = await self._session.execute(
            select(func.coalesce(func.sum(PointTransactionModel.points), 0)).where(
                PointTransactionModel.user_id == user_id
            )
        )
        return int(result.scalar() or 0)

    async def get_history(
        self, user_id: uuid.UUID, offset: int = 0, limit: int = 20
    ) -> list[PointTransaction]:
        result = await self._session.execute(
            select(PointTransactionModel)
            .where(PointTransactionModel.user_id == user_id)
            .order_by(PointTransactionModel.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return [point_transaction_model_to_entity(m) for m in result.scalars().all()]

    async def count_action_today(self, user_id: uuid.UUID, action: PointAction) -> int:
        now = datetime.utcnow()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        result = await self._session.execute(
            select(func.count()).where(
                and_(
                    PointTransactionModel.user_id == user_id,
                    PointTransactionModel.action == action.value,
                    PointTransactionModel.created_at >= start_of_day,
                )
            )
        )
        return result.scalar() or 0

    async def get_points_since(self, user_id: uuid.UUID, since: datetime) -> int:
        result = await self._session.execute(
            select(func.coalesce(func.sum(PointTransactionModel.points), 0)).where(
                and_(
                    PointTransactionModel.user_id == user_id,
                    PointTransactionModel.created_at >= since,
                )
            )
        )
        return int(result.scalar() or 0)

    async def count_history(self, user_id: uuid.UUID) -> int:
        result = await self._session.execute(
            select(func.count()).select_from(PointTransactionModel).where(
                PointTransactionModel.user_id == user_id
            )
        )
        return result.scalar() or 0
