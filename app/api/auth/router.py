"""Auth API router."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import get_auth_service, get_user_repository
from app.domain.exceptions import AuthenticationError, UserAlreadyExistsError
from app.interfaces.repositories.user_repository import IUserRepository
from app.interfaces.services.auth_service import IAuthService
from app.schemas.auth import (AuthResponse, ForgotPasswordRequest,
                              GoogleLoginRequest, LoginRequest,
                              RefreshTokenRequest, RegisterRequest,
                              ResetPasswordRequest, TokenResponse,
                              UserResponse)
from app.schemas.response import success_response
from app.use_cases.auth import (ForgotPasswordUseCase, GoogleLoginUseCase,
                                LoginUseCase, RefreshTokenUseCase,
                                RegisterUseCase, ResetPasswordUseCase)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    user_repo: IUserRepository = Depends(get_user_repository),
    auth_service: IAuthService = Depends(get_auth_service),
):
    try:
        uc = RegisterUseCase(user_repo, auth_service)
        user, tokens = await uc.execute(body.email, body.full_name, body.password)
        return success_response(
            data=AuthResponse(
                user=UserResponse(
                    id=user.id,
                    email=user.email,
                    full_name=user.full_name,
                    auth_provider=user.auth_provider.value,
                    avatar_url=user.avatar_url,
                    is_active=user.is_active,
                    created_at=user.created_at,
                    updated_at=user.updated_at,
                ),
                tokens=TokenResponse(
                    access_token=tokens.access_token,
                    refresh_token=tokens.refresh_token,
                ),
            ).model_dump(mode="json"),
            message="Registration successful",
        )
    except UserAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.post("/login")
async def login(
    body: LoginRequest,
    user_repo: IUserRepository = Depends(get_user_repository),
    auth_service: IAuthService = Depends(get_auth_service),
):
    try:
        uc = LoginUseCase(user_repo, auth_service)
        user, tokens = await uc.execute(body.email, body.password)
        return success_response(
            data=AuthResponse(
                user=UserResponse(
                    id=user.id,
                    email=user.email,
                    full_name=user.full_name,
                    auth_provider=user.auth_provider.value,
                    avatar_url=user.avatar_url,
                    is_active=user.is_active,
                    created_at=user.created_at,
                    updated_at=user.updated_at,
                ),
                tokens=TokenResponse(
                    access_token=tokens.access_token,
                    refresh_token=tokens.refresh_token,
                ),
            ).model_dump(mode="json"),
            message="Login successful",
        )
    except AuthenticationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))


@router.post("/google")
async def google_login(
    body: GoogleLoginRequest,
    user_repo: IUserRepository = Depends(get_user_repository),
    auth_service: IAuthService = Depends(get_auth_service),
):
    try:
        uc = GoogleLoginUseCase(user_repo, auth_service)
        user, tokens = await uc.execute(body.code)
        return success_response(
            data=AuthResponse(
                user=UserResponse(
                    id=user.id,
                    email=user.email,
                    full_name=user.full_name,
                    auth_provider=user.auth_provider.value,
                    avatar_url=user.avatar_url,
                    is_active=user.is_active,
                    created_at=user.created_at,
                    updated_at=user.updated_at,
                ),
                tokens=TokenResponse(
                    access_token=tokens.access_token,
                    refresh_token=tokens.refresh_token,
                ),
            ).model_dump(mode="json"),
            message="Google login successful",
        )
    except AuthenticationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))


@router.post("/refresh")
async def refresh_token(
    body: RefreshTokenRequest,
    user_repo: IUserRepository = Depends(get_user_repository),
    auth_service: IAuthService = Depends(get_auth_service),
):
    try:
        uc = RefreshTokenUseCase(user_repo, auth_service)
        tokens = await uc.execute(body.refresh_token)
        return success_response(
            data=TokenResponse(
                access_token=tokens.access_token,
                refresh_token=tokens.refresh_token,
            ).model_dump(mode="json"),
            message="Token refreshed",
        )
    except AuthenticationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))


@router.post("/forgot-password")
async def forgot_password(
    body: ForgotPasswordRequest,
    user_repo: IUserRepository = Depends(get_user_repository),
    auth_service: IAuthService = Depends(get_auth_service),
):
    """Send a password reset token. Always returns success to prevent email enumeration."""
    uc = ForgotPasswordUseCase(user_repo, auth_service)
    token = await uc.execute(body.email)
    # In production, send token via email. For now, return it directly.
    # Always return 200 regardless of whether email exists.
    return success_response(
        data={"reset_token": token},
        message="If an account with that email exists, a reset link has been sent.",
    )


@router.post("/reset-password")
async def reset_password(
    body: ResetPasswordRequest,
    user_repo: IUserRepository = Depends(get_user_repository),
    auth_service: IAuthService = Depends(get_auth_service),
):
    """Reset password using a valid reset token."""
    try:
        uc = ResetPasswordUseCase(user_repo, auth_service)
        await uc.execute(body.token, body.new_password)
        return success_response(message="Password updated successfully")
    except AuthenticationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
