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
