"""Forgot password use case — generates a reset token."""

from __future__ import annotations

from app.interfaces.repositories.user_repository import IUserRepository
from app.interfaces.services.auth_service import IAuthService


class ForgotPasswordUseCase:
    def __init__(self, user_repo: IUserRepository, auth_service: IAuthService) -> None:
        self._user_repo = user_repo
        self._auth_service = auth_service

    async def execute(self, email: str) -> str | None:
        """Return a reset token if the user exists, else None.

        We return None silently to prevent email enumeration.
        The caller should always return a success message regardless.
        """
        user = await self._user_repo.get_by_email(email)
        if not user or not user.is_active:
            return None
        return self._auth_service.create_password_reset_token(user.id)
