"""Postgres user repository implementation."""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.user import User
from app.infrastructure.db.mappers import (user_entity_to_model,
                                           user_model_to_entity)
from app.infrastructure.db.models import UserModel
from app.interfaces.repositories.user_repository import IUserRepository


class PostgresUserRepository(IUserRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, user: User) -> User:
        model = user_entity_to_model(user)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return user_model_to_entity(model)

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        result = await self._session.execute(select(UserModel).where(UserModel.id == user_id))
        model = result.scalar_one_or_none()
        return user_model_to_entity(model) if model else None

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self._session.execute(select(UserModel).where(UserModel.email == email))
        model = result.scalar_one_or_none()
        return user_model_to_entity(model) if model else None

    async def get_by_google_sub(self, google_sub: str) -> Optional[User]:
        result = await self._session.execute(select(UserModel).where(UserModel.google_sub == google_sub))
        model = result.scalar_one_or_none()
        return user_model_to_entity(model) if model else None

    async def update(self, user: User) -> User:
        result = await self._session.execute(select(UserModel).where(UserModel.id == user.id))
        model = result.scalar_one_or_none()
        if model:
            model.email = user.email
            model.full_name = user.full_name
            model.hashed_password = user.hashed_password
            model.auth_provider = user.auth_provider.value
            model.google_sub = user.google_sub
            model.avatar_url = user.avatar_url
            model.is_active = user.is_active
            model.updated_at = user.updated_at
            await self._session.flush()
            await self._session.refresh(model)
            return user_model_to_entity(model)
        return user

    async def delete(self, user_id: uuid.UUID) -> None:
        result = await self._session.execute(select(UserModel).where(UserModel.id == user_id))
        model = result.scalar_one_or_none()
        if model:
            await self._session.delete(model)
            await self._session.flush()

    async def search(self, query: str, offset: int = 0, limit: int = 20) -> list[User]:
        pattern = f"%{query}%"
        stmt = (
            select(UserModel)
            .where(
                UserModel.is_active == True,
                or_(
                    func.lower(UserModel.full_name).contains(query.lower()),
                    func.lower(UserModel.email).contains(query.lower()),
                ),
            )
            .order_by(UserModel.full_name)
            .offset(offset)
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return [user_model_to_entity(m) for m in result.scalars().all()]

    async def list_all(self, offset: int = 0, limit: int = 20) -> list[User]:
        stmt = (
            select(UserModel)
            .where(UserModel.is_active == True)
            .order_by(UserModel.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return [user_model_to_entity(m) for m in result.scalars().all()]

    async def count_search(self, query: str) -> int:
        stmt = select(func.count()).select_from(UserModel).where(
            UserModel.is_active == True,  # noqa: E712
            or_(
                func.lower(UserModel.full_name).contains(query.lower()),
                func.lower(UserModel.email).contains(query.lower()),
            ),
        )
        result = await self._session.execute(stmt)
        return result.scalar() or 0

    async def count_all(self) -> int:
        result = await self._session.execute(
            select(func.count()).select_from(UserModel).where(UserModel.is_active == True)  # noqa: E712
        )
        return result.scalar() or 0
