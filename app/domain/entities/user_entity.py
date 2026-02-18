import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

from app.application.dtos import AuthProvider


@dataclass
class User:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    email: str = ""
    first_name: str = ""
    last_name: str = ""
    hashed_password: Optional[str] = None
    auth_provider: AuthProvider = AuthProvider.EMAIL
    google_sub: Optional[str] = None
    avatar_url: Optional[str] = None
    has_password: Optional[bool] = False
    is_active: bool = False
    is_email_verified: Optional[bool] = False
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    # ── Business rules ──────────────────────────────────────────

    def activate(self) -> None:
        self.is_active = True
        self.updated_at = datetime.now(timezone.utc)

    def deactivate(self) -> None:
        self.is_active = False
        self.updated_at = datetime.now(timezone.utc)

    def verify_email(self) -> None:
        self.is_email_verified = True
        self.is_active = True
        self.updated_at = datetime.now(timezone.utc)

    def update_profile(self, first_name: str, last_name: str) -> None:
        self.first_name = first_name
        self.last_name = last_name
        self.updated_at = datetime.now(timezone.utc)

    def update_avatar(self, avatar_url: Optional[str]) -> None:
        self.avatar_url = avatar_url
        self.updated_at = datetime.now(timezone.utc)

    def set_password(self, hashed_password: str) -> None:
        """Set password for the first time (e.g. Google users adding a password)."""
        self.hashed_password = hashed_password
        self.has_password = True
        self.updated_at = datetime.now(timezone.utc)

    def change_password(self, new_hashed_password: str) -> None:
        """Replace an existing password."""
        self.hashed_password = new_hashed_password
        self.updated_at = datetime.now(timezone.utc)

    @staticmethod
    def create_email_user(email: str, first_name: str, last_name: str, hashed_password: str) -> "User":
        return User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            hashed_password=hashed_password,
            has_password=True,
            is_active=False,
            is_email_verified=False,
            auth_provider=AuthProvider.EMAIL,
        )

    @staticmethod
    def create_google_user(email: str, first_name: str, last_name: str, google_sub: str, avatar_url: Optional[str] = None) -> "User":
        return User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            auth_provider=AuthProvider.GOOGLE,
            has_password=False,
            is_active=True,
            is_email_verified=True,  # Google accounts are pre-verified
            google_sub=google_sub,
            avatar_url=avatar_url,
        )
