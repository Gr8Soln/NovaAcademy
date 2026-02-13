"""Reset password use case — validates token and updates password."""

from __future__ import annotations

from app.domain.exceptions import AuthenticationError
from app.interfaces.repositories.user_repository import IUserRepository
from app.interfaces.services.auth_service import IAuthService


class ResetPasswordUseCase:
    def __init__(self, user_repo: IUserRepository, auth_service: IAuthService) -> None:
        self._user_repo = user_repo
        self._auth_service = auth_service

    async def execute(self, token: str, new_password: str) -> None:
        """Validate reset token and update the user's password."""
        user_id = self._auth_service.decode_password_reset_token(token)
        user = await self._user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise AuthenticationError("Invalid or expired reset token")

        user.hashed_password = self._auth_service.hash_password(new_password)
        await self._user_repo.update(user)
