from typing import Optional

from pydantic import BaseModel, Field


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=256)
    last_name: Optional[str] = Field(None, min_length=1, max_length=256)


class UpdateUsernameRequest(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=15,
        pattern=r'^[A-Za-z_][A-Za-z0-9_]{2,14}$',
        description=(
            "3–15 characters; letters, digits, underscore only; "
            "must not start with a digit."
        ),
    )


class SetPasswordRequest(BaseModel):
    password: str = Field(..., min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)
