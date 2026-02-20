from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.adapters.schemas import (ChangePasswordRequest, SetPasswordRequest,
                                  UpdateProfileRequest, UpdateUsernameRequest,
                                  UserResponse, success_response)
from app.application.use_cases import (ChangePasswordUseCase,
                                       DeactivateAccountUseCase,
                                       RemoveAvatarUseCase, SetPasswordUseCase,
                                       UpdateProfileUseCase,
                                       UpdateUsernameUseCase,
                                       UploadAvatarUseCase)
from app.core.logging import get_logger
from app.domain.entities import User
from app.domain.exceptions import (InvalidCredentialError,
                                   InvalidUsernameError, UsernameCooldownError,
                                   UsernameUnavailableError)
from app.infrastructure.api.dependencies import (
    get_change_password_usecase, get_current_user,
    get_deactivate_account_usecase, get_remove_avatar_usecase,
    get_set_password_usecase, get_update_profile_usecase,
    get_update_username_usecase, get_upload_avatar_usecase)

router = APIRouter(prefix="/users", tags=["Users"])
logger = get_logger(__name__)

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_MAX_AVATAR_BYTES = 5 * 1024 * 1024  # 5 MB


def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        username=user.username,
        auth_provider=(
            user.auth_provider.value
            if hasattr(user.auth_provider, "value")
            else user.auth_provider
        ),
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        has_password=user.has_password,
        is_email_verified=user.is_email_verified,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


# ── GET /users/me ─────────────────────────────────────────────────

@router.get("/me", status_code=status.HTTP_200_OK)
async def get_me(current_user: User = Depends(get_current_user)):
    return success_response(
        data=_user_response(current_user).model_dump(mode="json"),
        message="User retrieved",
    )


# ── PATCH /users/me ───────────────────────────────────────────────

@router.patch("/me", status_code=status.HTTP_200_OK)
async def update_me(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    use_case: UpdateProfileUseCase = Depends(get_update_profile_usecase),
):
    updated = await use_case.execute(
        current_user.id,
        first_name=body.first_name,
        last_name=body.last_name,
    )
    return success_response(
        data=_user_response(updated).model_dump(mode="json"),
        message="Profile updated",
    )


# ── POST /users/me/avatar ─────────────────────────────────────────

@router.post("/me/avatar", status_code=status.HTTP_200_OK)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    use_case: UploadAvatarUseCase = Depends(get_upload_avatar_usecase),
):
    if file.content_type not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type. Allowed: {', '.join(_ALLOWED_IMAGE_TYPES)}",
        )

    # Peek at size without consuming the stream
    contents = await file.read()
    if len(contents) > _MAX_AVATAR_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size is 5 MB.",
        )
    await file.seek(0)

    updated = await use_case.execute(current_user.id, file)
    return success_response(
        data=_user_response(updated).model_dump(mode="json"),
        message="Avatar uploaded",
    )


# ── DELETE /users/me/avatar ───────────────────────────────────────

@router.delete("/me/avatar", status_code=status.HTTP_200_OK)
async def remove_avatar(
    current_user: User = Depends(get_current_user),
    use_case: RemoveAvatarUseCase = Depends(get_remove_avatar_usecase),
):
    # Clean up the physical file regardless of how it was uploaded
    if current_user.avatar_url:
        old_path: Path | None = None
        url = current_user.avatar_url

        if "/api/v1/avatar/" in url:
            # New storage service URL: .../api/v1/avatar/<file_id><ext>
            filename = url.rsplit("/api/v1/avatar/", 1)[-1]
            old_path = Path("uploads") / "avatars" / filename
        elif url.startswith("/uploads/"):
            # Legacy direct-path URL
            old_path = Path(".") / url.lstrip("/")

        if old_path:
            try:
                old_path.unlink(missing_ok=True)
            except OSError:
                pass

    updated = await use_case.execute(current_user.id)
    return success_response(
        data=_user_response(updated).model_dump(mode="json"),
        message="Avatar removed",
    )


# ── POST /users/me/password  (set for the first time) ────────────

@router.post("/me/password", status_code=status.HTTP_200_OK)
async def set_password(
    body: SetPasswordRequest,
    current_user: User = Depends(get_current_user),
    use_case: SetPasswordUseCase = Depends(get_set_password_usecase),
):
    try:
        updated = await use_case.execute(current_user.id, body.password)
    except InvalidCredentialError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    return success_response(
        data=_user_response(updated).model_dump(mode="json"),
        message="Password set successfully",
    )


# ── PUT /users/me/password  (change existing) ────────────────────

@router.put("/me/password", status_code=status.HTTP_200_OK)
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    use_case: ChangePasswordUseCase = Depends(get_change_password_usecase),
):
    try:
        updated = await use_case.execute(
            current_user.id, body.current_password, body.new_password
        )
    except InvalidCredentialError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    return success_response(
        data=_user_response(updated).model_dump(mode="json"),
        message="Password changed successfully",
    )


# ── DELETE /users/me  (deactivate) ───────────────────────────────

@router.delete("/me", status_code=status.HTTP_200_OK)
async def deactivate_account(
    current_user: User = Depends(get_current_user),
    use_case: DeactivateAccountUseCase = Depends(get_deactivate_account_usecase),
):
    await use_case.execute(current_user.id)
    return success_response(message="Account deactivated successfully.")

# ── PATCH /users/me/username ────────────────────────────────────────

@router.patch("/me/username", status_code=status.HTTP_200_OK)
async def update_username(
    body: UpdateUsernameRequest,
    current_user: User = Depends(get_current_user),
    use_case: UpdateUsernameUseCase = Depends(get_update_username_usecase),
):
    try:
        updated = await use_case.execute(current_user.id, body.username)
    except InvalidUsernameError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except UsernameCooldownError as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc))
    except UsernameUnavailableError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    return success_response(
        data=_user_response(updated).model_dump(mode="json"),
        message="Username updated successfully.",
    )