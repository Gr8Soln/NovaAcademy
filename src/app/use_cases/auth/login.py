"""Log in with email + password."""

from __future__ import annotations

from app.domain.entities.user import User
from app.domain.exceptions import AuthenticationError
from app.interfaces.repositories.user_repository import IUserRepository
from app.interfaces.services.auth_service import IAuthService, TokenPair


class LoginUseCase:
    def __init__(self, user_repo: IUserRepository, auth_service: IAuthService) -> None:
        self._user_repo = user_repo
        self._auth_service = auth_service

    async def execute(self, email: str, password: str) -> tuple[User, TokenPair]:
        user = await self._user_repo.get_by_email(email)
        if not user or not user.hashed_password:
            raise AuthenticationError("Invalid email or password")

        if not self._auth_service.verify_password(password, user.hashed_password):
            raise AuthenticationError("Invalid email or password")

        if not user.is_active:
            raise AuthenticationError("Account is deactivated")

        tokens = self._auth_service.create_tokens(user.id)
        return user, tokens
