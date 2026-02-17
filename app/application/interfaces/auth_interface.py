import uuid
from abc import ABC, abstractmethod

from app.application.dtos import GoogleUserInfo, TokenPair


class IAuthInterface(ABC):

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

    @abstractmethod
    def create_password_reset_token(self, user_id: uuid.UUID) -> str:
        """Create a short-lived token for password reset."""
        ...

    @abstractmethod
    def decode_password_reset_token(self, token: str) -> uuid.UUID:
        """Decode and validate a password reset token, return user_id."""
        ...
