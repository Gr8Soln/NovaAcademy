"""User / profile use cases."""
import uuid

from fastapi import UploadFile

from app.application.interfaces import (IJwtService, IStorageService,
                                        IUserInterface)
from app.core.logging import get_logger
from app.domain.entities import User
from app.domain.exceptions import (AccountInactiveError, AuthenticationError,
                                   InvalidCredentialError,
                                   InvalidUsernameError,
                                   UsernameCooldownError,
                                   UsernameUnavailableError,
                                   UserNotFoundError)

logger = get_logger(__name__)


# ── Helpers ─────────────────────────────────────────────────────

async def _get_active_user(user_repo: IUserInterface, user_id: uuid.UUID) -> User:
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise UserNotFoundError("User not found")
    if not user.is_active:
        raise AccountInactiveError("Account is inactive")
    return user


# ── Get Current User ─────────────────────────────────────────────

class GetCurrentUserUseCase:
    def __init__(self, user_repo: IUserInterface) -> None:
        self._user_repo = user_repo

    async def execute(self, user_id: uuid.UUID) -> User:
        return await _get_active_user(self._user_repo, user_id)


# ── Update Profile  (first / last name) ──────────────────────────

class UpdateProfileUseCase:
    def __init__(self, user_repo: IUserInterface) -> None:
        self._user_repo = user_repo

    async def execute(
        self,
        user_id: uuid.UUID,
        first_name: str | None = None,
        last_name: str | None = None,
    ) -> User:
        user = await _get_active_user(self._user_repo, user_id)
        user.update_profile(
            first_name=first_name or user.first_name,
            last_name=last_name or user.last_name,
        )
        return await self._user_repo.update(user)


# ── Upload Avatar ────────────────────────────────────────────────

class UploadAvatarUseCase:
    def __init__(self, user_repo: IUserInterface, storage: IStorageService) -> None:
        self._user_repo = user_repo
        self._storage = storage

    async def execute(self, user_id: uuid.UUID, file: UploadFile) -> User:
        result = await self._storage.upload_avatar(file)
        avatar_url = result["file_url"]
        user = await _get_active_user(self._user_repo, user_id)
        user.update_avatar(avatar_url)
        return await self._user_repo.update(user)


# ── Remove Avatar ────────────────────────────────────────────────

class RemoveAvatarUseCase:
    def __init__(self, user_repo: IUserInterface) -> None:
        self._user_repo = user_repo

    async def execute(self, user_id: uuid.UUID) -> User:
        user = await _get_active_user(self._user_repo, user_id)
        user.update_avatar(None)
        return await self._user_repo.update(user)


# ── Set Password (first-time, e.g. Google users) ─────────────────

class SetPasswordUseCase:
    def __init__(self, user_repo: IUserInterface, jwt_svc: IJwtService) -> None:
        self._user_repo = user_repo
        self._jwt_svc = jwt_svc

    async def execute(self, user_id: uuid.UUID, password: str) -> User:
        user = await _get_active_user(self._user_repo, user_id)
        if user.has_password:
            raise InvalidCredentialError(
                "Password already set. Use change-password instead."
            )
        hashed = self._jwt_svc.hash_password(password)
        user.set_password(hashed)
        return await self._user_repo.update(user)


# ── Change Password ──────────────────────────────────────────────

class ChangePasswordUseCase:
    def __init__(self, user_repo: IUserInterface, jwt_svc: IJwtService) -> None:
        self._user_repo = user_repo
        self._jwt_svc = jwt_svc

    async def execute(
        self, user_id: uuid.UUID, current_password: str, new_password: str
    ) -> User:
        user = await _get_active_user(self._user_repo, user_id)
        if not user.has_password or not user.hashed_password:
            raise InvalidCredentialError(
                "No password set. Use set-password first."
            )
        if not self._jwt_svc.verify_password(current_password, user.hashed_password):
            raise InvalidCredentialError("Current password is incorrect")

        hashed = self._jwt_svc.hash_password(new_password)
        user.change_password(hashed)
        return await self._user_repo.update(user)


# ── Deactivate Account ───────────────────────────────────────────

class DeactivateAccountUseCase:
    def __init__(self, user_repo: IUserInterface) -> None:
        self._user_repo = user_repo

    async def execute(self, user_id: uuid.UUID) -> None:
        user = await _get_active_user(self._user_repo, user_id)
        user.is_active = False
        await self._user_repo.update(user)


# ── Update Username ─────────────────────────────────────────────

class UpdateUsernameUseCase:
    def __init__(self, user_repo: IUserInterface) -> None:
        self._user_repo = user_repo

    async def execute(self, user_id: uuid.UUID, new_username: str) -> User:
        # Validate format
        if not User.validate_username(new_username):
            raise InvalidUsernameError(
                "Username must be 3–15 characters, contain only letters, digits, "
                "or underscores, and must not start with a digit."
            )

        user = await _get_active_user(self._user_repo, user_id)

        # Cooldown check
        if not user.can_change_username():
            raise UsernameCooldownError(
                "Username can only be changed once every 7 days."
            )

        # Uniqueness check (case-insensitive)
        existing = await self._user_repo.get_by_username(new_username.lower())
        if existing and existing.id != user_id:
            raise UsernameUnavailableError(
                f"Username '{new_username}' is already taken."
            )

        user.update_username(new_username.lower())
        return await self._user_repo.update(user)
