"""Google OAuth login / auto-register."""

from __future__ import annotations

from app.domain.entities.user import User
from app.interfaces.repositories.user_repository import IUserRepository
from app.interfaces.services.auth_service import IAuthService, TokenPair


class GoogleLoginUseCase:
    def __init__(self, user_repo: IUserRepository, auth_service: IAuthService) -> None:
        self._user_repo = user_repo
        self._auth_service = auth_service

    async def execute(self, oauth_code: str) -> tuple[User, TokenPair]:
        google_info = await self._auth_service.get_google_user_info(oauth_code)

        # Try to find existing user by Google subject ID
        user = await self._user_repo.get_by_google_sub(google_info.google_sub)
        if not user:
            # Try by email (link accounts)
            user = await self._user_repo.get_by_email(google_info.email)
            if user:
                # Link Google account to existing email user
                user.google_sub = google_info.google_sub
                user.avatar_url = user.avatar_url or google_info.avatar_url
                user = await self._user_repo.update(user)
            else:
                # Create new user
                user = User.create_google_user(
                    email=google_info.email,
                    full_name=google_info.full_name,
                    google_sub=google_info.google_sub,
                    avatar_url=google_info.avatar_url,
                )
                user = await self._user_repo.create(user)

        tokens = self._auth_service.create_tokens(user.id)
        return user, tokens
