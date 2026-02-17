from fastapi import APIRouter, Depends, HTTPException, status

from app.adapters.schemas import (AuthResponse, RegisterRequest, TokenResponse,
                                  UserResponse, success_response)
from app.application.interfaces import IUserInterface
from app.domain.exceptions import UserAlreadyExistsError

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    user_repo: IUserInterface = Depends(get_user_repository),
    auth_service: IAuthService = Depends(get_auth_service),
):
    try:
        uc = RegisterUseCase(user_repo, auth_service)
        user, tokens = await uc.execute(body.email, body.first_name, body.last_name, body.password)
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
