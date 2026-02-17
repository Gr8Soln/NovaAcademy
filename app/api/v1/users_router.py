"""User profile API router."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.dependencies import get_current_user, get_user_repository
from app.domain.entities.user import User
from app.interfaces.repositories.user_repository import IUserRepository
from app.schemas.auth import UserResponse
from app.schemas.response import paginated_response, success_response

router = APIRouter(prefix="/users", tags=["users"])


class UpdateProfileRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=256)
    avatar_url: Optional[str] = None


def _user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        auth_provider=user.auth_provider.value,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return success_response(
        data=_user_to_response(current_user).model_dump(mode="json"),
        message="Profile retrieved",
    )


@router.put("/me")
async def update_me(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    user_repo: IUserRepository = Depends(get_user_repository),
):
    current_user.update_profile(full_name=body.full_name, avatar_url=body.avatar_url)
    updated = await user_repo.update(current_user)
    return success_response(
        data=_user_to_response(updated).model_dump(mode="json"),
        message="Profile updated",
    )


@router.get("/search")
async def search_users(
    q: str = "",
    offset: int = 0,
    limit: int = 20,
    _: User = Depends(get_current_user),
    user_repo: IUserRepository = Depends(get_user_repository),
):
    """Search users by name or email for follow/challenge discovery."""
    if q.strip():
        users = await user_repo.search(q.strip(), offset=offset, limit=limit)
        total = await user_repo.count_search(q.strip())
    else:
        users = await user_repo.list_all(offset=offset, limit=limit)
        total = await user_repo.count_all()
    return paginated_response(
        data=[_user_to_response(u).model_dump(mode="json") for u in users],
        message="Users retrieved",
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get("/{user_id}")
async def get_user(
    user_id: uuid.UUID,
    _: User = Depends(get_current_user),
    user_repo: IUserRepository = Depends(get_user_repository),
):
    """Get a user's public profile by ID."""
    user = await user_repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="User not found")
    return success_response(
        data=_user_to_response(user).model_dump(mode="json"),
        message="User retrieved",
    )
