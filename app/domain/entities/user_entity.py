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
    google_sub: Optional[str] = None  # Google OAuth subject ID
    avatar_url: Optional[str] = None
    is_active: bool = False
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    # ── Business rules ──────────────────────────────────────────

    def activate(self) -> None:
        self.is_active = True
        self.updated_at = datetime.now(timezone.utc)
        
    def deactivate(self) -> None:
        self.is_active = False
        self.updated_at = datetime.now(timezone.utc)

    def update_profile(self, first_name: str, last_name: str, avatar_url: Optional[str] = None) -> None:
        self.first_name = first_name
        self.last_name = last_name  
        if avatar_url is not None:
            self.avatar_url = avatar_url
        self.updated_at = datetime.now(timezone.utc)

    @staticmethod
    def create_email_user(email: str, first_name: str, last_name: str, hashed_password: str) -> "User":
        return User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            hashed_password=hashed_password,
            auth_provider=AuthProvider.EMAIL,
        )

    @staticmethod
    def create_google_user(email: str, first_name: str, last_name: str, google_sub: str, avatar_url: Optional[str] = None) -> "User":
        return User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            auth_provider=AuthProvider.GOOGLE,
            google_sub=google_sub,
            avatar_url=avatar_url,
        )
