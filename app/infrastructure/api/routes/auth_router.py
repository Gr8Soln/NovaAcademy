from fastapi import APIRouter, Depends, HTTPException, status

from app.adapters.schemas import (AuthResponse, GoogleAuthRequest,
                                  RegisterRequest, TokenResponse, UserResponse,
                                  success_response)
from app.application.use_cases import GoogleAuthUseCase, RegisterUseCase
from app.domain.exceptions import UserAlreadyExistsError
from app.infrastructure.api.dependencies import (get_google_auth_usecase,
                                                 get_register_usecase)

router = APIRouter(prefix="/auth", tags=["Auth Endpoints"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    use_case: RegisterUseCase = Depends(get_register_usecase)
):
    try:
        user, tokens = await use_case.execute(body.email, body.first_name, body.last_name, body.password)
        return success_response(
            data=AuthResponse(
                user=UserResponse(
                    id=user.id,
                    email=user.email,
                    first_name=user.first_name,
                    last_name=user.last_name,
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


@router.post("/google", status_code=status.HTTP_201_CREATED)
async def google_auth(
    body: GoogleAuthRequest,
    use_case: GoogleAuthUseCase = Depends(get_google_auth_usecase)
):
    try:
        await use_case.execute(body.code)
        user, tokens, is_new_user = await use_case.execute(body.code)
        
        return success_response(
            data=AuthResponse(
                user=UserResponse(
                    id=user.id,
                    email=user.email,
                    first_name=user.first_name,
                    last_name=user.last_name,
                    auth_provider='google',
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
            message=f"{'Registration Successful' if is_new_user else 'Login successful'}",
        )
        
    except UserAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
