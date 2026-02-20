import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.application.dtos import AuthProvider

_USERNAME_RE = re.compile(r'^[A-Za-z_][A-Za-z0-9_]{2,14}$')


@dataclass
class User:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    email: str = ""
    first_name: str = ""
    last_name: str = ""
    username: Optional[str] = None
    username_changed_at: Optional[datetime] = None
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

    # ── Username ────────────────────────────────────────────────

    @staticmethod
    def validate_username(username: str) -> bool:
        """Return True if the username satisfies all format rules."""
        return bool(_USERNAME_RE.match(username))

    @staticmethod
    def sanitize_username_from_email(email: str) -> str:
        """Derive a best-effort valid username base from an e-mail address.

        Rules applied:
        • Take the local part (before @).
        • Replace characters outside [A-Za-z0-9_] with '_'.
        • Strip leading digits (prepend '_' if the result still starts with one).
        • Collapse consecutive underscores to one.
        • Truncate to 12 chars (leaves room for a 3-digit uniqueness suffix).
        • Ensure at least 3 chars by padding with 'x'.
        """
        local = email.split("@")[0]
        # Replace invalid chars with underscore
        cleaned = re.sub(r'[^A-Za-z0-9_]', '_', local)
        # Ensure it doesn't start with a digit
        cleaned = re.sub(r'^[0-9]+', '', cleaned) or 'user'
        # Collapse multiple underscores
        cleaned = re.sub(r'_+', '_', cleaned).strip('_') or 'user'
        # Truncate to 12 to leave room for suffix
        cleaned = cleaned[:12]
        # Pad to minimum 3 characters
        while len(cleaned) < 3:
            cleaned += 'x'
        return cleaned.lower()

    def set_initial_username(self, username: str) -> None:
        """Set the auto-generated username at registration (no cooldown recorded)."""
        self.username = username
        self.updated_at = datetime.now(timezone.utc)

    def can_change_username(self) -> bool:
        """Return True when the user is eligible to change their username."""
        if self.username_changed_at is None:
            return True
        # Make naive datetimes timezone-aware before comparison
        last = self.username_changed_at
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) - last >= timedelta(days=7)

    def update_username(self, new_username: str) -> None:
        """Manually update username; records the change timestamp for cooldown."""
        self.username = new_username
        self.username_changed_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    # ── Activation / deactivation ────────────────────────────────

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
    def create_email_user(
        email: str,
        first_name: str,
        last_name: str,
        hashed_password: str,
        username: Optional[str] = None,
    ) -> "User":
        return User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            username=username,
            hashed_password=hashed_password,
            has_password=True,
            is_active=False,
            is_email_verified=False,
            auth_provider=AuthProvider.EMAIL,
        )

    @staticmethod
    def create_google_user(
        email: str,
        first_name: str,
        last_name: str,
        google_sub: str,
        avatar_url: Optional[str] = None,
        username: Optional[str] = None,
    ) -> "User":
        return User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            username=username,
            auth_provider=AuthProvider.GOOGLE,
            has_password=False,
            is_active=True,
            is_email_verified=True,  # Google accounts are pre-verified
            google_sub=google_sub,
            avatar_url=avatar_url,
        )
