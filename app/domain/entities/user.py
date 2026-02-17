import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class AuthProvider(str, Enum):
    EMAIL = "email"
    GOOGLE = "google"


@dataclass
class User:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    email: str = ""
    full_name: str = ""
    hashed_password: Optional[str] = None
    auth_provider: AuthProvider = AuthProvider.EMAIL
    google_sub: Optional[str] = None  # Google OAuth subject ID
    avatar_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    # ── Business rules ──────────────────────────────────────────

    def deactivate(self) -> None:
        self.is_active = False
        self.updated_at = datetime.utcnow()

    def update_profile(self, full_name: str, avatar_url: Optional[str] = None) -> None:
        self.full_name = full_name
        if avatar_url is not None:
            self.avatar_url = avatar_url
        self.updated_at = datetime.utcnow()

    @staticmethod
    def create_email_user(email: str, full_name: str, hashed_password: str) -> "User":
        return User(
            email=email,
            full_name=full_name,
            hashed_password=hashed_password,
            auth_provider=AuthProvider.EMAIL,
        )

    @staticmethod
    def create_google_user(email: str, full_name: str, google_sub: str, avatar_url: Optional[str] = None) -> "User":
        return User(
            email=email,
            full_name=full_name,
            auth_provider=AuthProvider.GOOGLE,
            google_sub=google_sub,
            avatar_url=avatar_url,
        )
