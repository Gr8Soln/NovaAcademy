"""Abstract auth service interface — handles hashing, tokens, OAuth."""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class TokenPair:
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


@dataclass
class GoogleUserInfo:
    email: str
    full_name: str
    google_sub: str
    avatar_url: Optional[str] = None


class IAuthService(ABC):

    @abstractmethod
    def hash_password(self, password: str) -> str:
        ...

    @abstractmethod
    def verify_password(self, plain: str, hashed: str) -> bool:
        ...

    @abstractmethod
    def create_tokens(self, user_id: uuid.UUID) -> TokenPair:
        ...

    @abstractmethod
    def decode_access_token(self, token: str) -> uuid.UUID:
        """Return user_id from a valid access token, raise on invalid."""
        ...

    @abstractmethod
    def decode_refresh_token(self, token: str) -> uuid.UUID:
        ...

    @abstractmethod
    async def get_google_user_info(self, code: str) -> GoogleUserInfo:
        """Exchange OAuth code for Google user info."""
        ...
