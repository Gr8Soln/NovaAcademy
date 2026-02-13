"""JWT + bcrypt auth service implementation."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
import httpx
from jose import JWTError, jwt

from app.domain.exceptions import AuthenticationError
from app.interfaces.services.auth_service import GoogleUserInfo, IAuthService, TokenPair


class JWTAuthService(IAuthService):
    def __init__(
        self,
        secret_key: str,
        algorithm: str = "HS256",
        access_token_expire_minutes: int = 30,
        refresh_token_expire_days: int = 7,
        google_client_id: Optional[str] = None,
        google_client_secret: Optional[str] = None,
        google_redirect_uri: Optional[str] = None,
    ) -> None:
        self._secret = secret_key
        self._algorithm = algorithm
        self._access_expire = timedelta(minutes=access_token_expire_minutes)
        self._refresh_expire = timedelta(days=refresh_token_expire_days)
        self._google_client_id = google_client_id
        self._google_client_secret = google_client_secret
        self._google_redirect_uri = google_redirect_uri

    # ── Password ────────────────────────────────────────────────

    def hash_password(self, password: str) -> str:
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    def verify_password(self, plain: str, hashed: str) -> bool:
        return bcrypt.checkpw(plain.encode(), hashed.encode())

    # ── JWT ─────────────────────────────────────────────────────

    def _create_token(self, user_id: uuid.UUID, expires_delta: timedelta, token_type: str) -> str:
        payload = {
            "sub": str(user_id),
            "type": token_type,
            "exp": datetime.utcnow() + expires_delta,
            "iat": datetime.utcnow(),
        }
        return jwt.encode(payload, self._secret, algorithm=self._algorithm)

    def create_tokens(self, user_id: uuid.UUID) -> TokenPair:
        return TokenPair(
            access_token=self._create_token(user_id, self._access_expire, "access"),
            refresh_token=self._create_token(user_id, self._refresh_expire, "refresh"),
        )

    def _decode_token(self, token: str, expected_type: str) -> uuid.UUID:
        try:
            payload = jwt.decode(token, self._secret, algorithms=[self._algorithm])
            if payload.get("type") != expected_type:
                raise AuthenticationError("Invalid token type")
            return uuid.UUID(payload["sub"])
        except JWTError as exc:
            raise AuthenticationError(f"Invalid token: {exc}") from exc

    def decode_access_token(self, token: str) -> uuid.UUID:
        return self._decode_token(token, "access")

    def decode_refresh_token(self, token: str) -> uuid.UUID:
        return self._decode_token(token, "refresh")

    # ── Google OAuth ────────────────────────────────────────────

    async def get_google_user_info(self, code: str) -> GoogleUserInfo:
        async with httpx.AsyncClient() as client:
            # Exchange code for tokens
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": self._google_client_id,
                    "client_secret": self._google_client_secret,
                    "redirect_uri": self._google_redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            token_resp.raise_for_status()
            tokens = token_resp.json()

            # Get user info
            user_resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            user_resp.raise_for_status()
            info = user_resp.json()

        return GoogleUserInfo(
            email=info["email"],
            full_name=info.get("name", ""),
            google_sub=info["id"],
            avatar_url=info.get("picture"),
        )
