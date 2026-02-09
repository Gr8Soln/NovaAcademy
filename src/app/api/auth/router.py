"""Auth API router."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import get_auth_service, get_user_repository
from app.domain.exceptions import AuthenticationError, UserAlreadyExistsError
from app.interfaces.repositories.user_repository import IUserRepository
from app.interfaces.services.auth_service import IAuthService
from app.schemas.auth import (
    AuthResponse,
    GoogleLoginRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.use_cases.auth import GoogleLoginUseCase, LoginUseCase, RefreshTokenUseCase, RegisterUseCase

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    user_repo: IUserRepository = Depends(get_user_repository),
    auth_service: IAuthService = Depends(get_auth_service),
):
    try:
        uc = RegisterUseCase(user_repo, auth_service)
        user, tokens = await uc.execute(body.email, body.full_name, body.password)
        return AuthResponse(
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
        )
    except UserAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.post("/login", response_model=AuthResponse)
async def login(
    body: LoginRequest,
    user_repo: IUserRepository = Depends(get_user_repository),
    auth_service: IAuthService = Depends(get_auth_service),
):
    try:
        uc = LoginUseCase(user_repo, auth_service)
        user, tokens = await uc.execute(body.email, body.password)
        return AuthResponse(
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
        )
    except AuthenticationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))


@router.post("/google", response_model=AuthResponse)
async def google_login(
    body: GoogleLoginRequest,
    user_repo: IUserRepository = Depends(get_user_repository),
    auth_service: IAuthService = Depends(get_auth_service),
):
    try:
        uc = GoogleLoginUseCase(user_repo, auth_service)
        user, tokens = await uc.execute(body.code)
        return AuthResponse(
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
        )
    except AuthenticationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    body: RefreshTokenRequest,
    user_repo: IUserRepository = Depends(get_user_repository),
    auth_service: IAuthService = Depends(get_auth_service),
):
    try:
        uc = RefreshTokenUseCase(user_repo, auth_service)
        tokens = await uc.execute(body.refresh_token)
        return TokenResponse(
            access_token=tokens.access_token,
            refresh_token=tokens.refresh_token,
        )
    except AuthenticationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
