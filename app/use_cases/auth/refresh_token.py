"""Refresh an expired access token."""

from __future__ import annotations

from app.domain.exceptions import AuthenticationError
from app.interfaces.repositories.user_repository import IUserRepository
from app.interfaces.services.auth_service import IAuthService, TokenPair


class RefreshTokenUseCase:
    def __init__(self, user_repo: IUserRepository, auth_service: IAuthService) -> None:
        self._user_repo = user_repo
        self._auth_service = auth_service

    async def execute(self, refresh_token: str) -> TokenPair:
        user_id = self._auth_service.decode_refresh_token(refresh_token)
        user = await self._user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise AuthenticationError("Invalid refresh token")
        return self._auth_service.create_tokens(user.id)
