"""Register a new user with email + password."""

from __future__ import annotations

from app.domain.entities.user import User
from app.domain.exceptions import UserAlreadyExistsError
from app.interfaces.repositories.user_repository import IUserRepository
from app.interfaces.services.auth_service import IAuthService, TokenPair


class RegisterUseCase:
    def __init__(self, user_repo: IUserRepository, auth_service: IAuthService) -> None:
        self._user_repo = user_repo
        self._auth_service = auth_service

    async def execute(self, email: str, full_name: str, password: str) -> tuple[User, TokenPair]:
        existing = await self._user_repo.get_by_email(email)
        if existing:
            raise UserAlreadyExistsError(f"User with email {email} already exists")

        hashed = self._auth_service.hash_password(password)
        user = User.create_email_user(email=email, full_name=full_name, hashed_password=hashed)
        user = await self._user_repo.create(user)
        tokens = self._auth_service.create_tokens(user.id)
        return user, tokens
