"""Pydantic schemas for user/profile endpoints."""
from typing import Optional

from pydantic import BaseModel, Field


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=256)
    last_name: Optional[str] = Field(None, min_length=1, max_length=256)


class SetPasswordRequest(BaseModel):
    password: str = Field(..., min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)
