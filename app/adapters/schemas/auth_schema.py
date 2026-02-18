import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

# ── Requests ────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=256)
    last_name: str = Field(..., min_length=1, max_length=256)
    password: str = Field(..., min_length=8, max_length=128)

class GoogleAuthRequest(BaseModel):
    code: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    code: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)


# ── Responses ───────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    auth_provider: str
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse
