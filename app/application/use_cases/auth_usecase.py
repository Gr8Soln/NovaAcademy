from typing import Optional

import httpx
from fastapi import HTTPException
from google.auth.transport import requests
from google.oauth2 import id_token

from app.application.dtos import TokenPair
from app.application.interfaces import IJwtService, IUserInterface
from app.core.logging import get_logger
from app.domain.entities import User
from app.domain.exceptions import UserAlreadyExistsError

logger = get_logger(__name__)

class RegisterUseCase:
    def __init__(self, user_repo: IUserInterface, auth_repo: IJwtService) -> None:
        self._user_repo = user_repo
        self._auth_repo = auth_repo

    async def execute(self, email: str, first_name: str, last_name: str, password: str) -> tuple[User, TokenPair]:
        existing = await self._user_repo.get_by_email(email)
        if existing:
            raise UserAlreadyExistsError(f"User with email {email} already exists")

        hashed = self._auth_repo.hash_password(password)
        user = User.create_email_user(email=email, first_name=first_name, last_name=last_name, hashed_password=hashed)
        user = await self._user_repo.create(user)
        tokens = self._auth_repo.create_tokens(user.id)
        return user, tokens

class GoogleAuthUseCase:
    def __init__(self, user_repo: IUserInterface, auth_repo: IJwtService, google_client_id: str) -> None:
        self._user_repo = user_repo
        self._auth_repo = auth_repo
        self._google_client_id = google_client_id

        
    async def execute(self, code: str, is_access_token: Optional[bool] = True) -> tuple[User, TokenPair, bool]:
        google_user = {}
        
        if is_access_token:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {code}"}
                )
                if resp.status_code != 200:
                    raise HTTPException(status_code=401, detail="Invalid token")
                google_user = resp.json()  # contains email, name, sub, etc.
            
        else:
            try:
                google_user = id_token.verify_oauth2_token(
                    code,
                    requests.Request(),
                    self._google_client_id,
                    clock_skew_in_seconds=10
                )
            except ValueError as exc:
                raise HTTPException(status_code=401, detail="Invalid token")

        email = google_user["email"]
        first_name = google_user.get("name", "").split(" ")[0]
        last_name = google_user.get("family_name", "")
        google_sub = google_user["sub"]
        google_user_avatar = google_user.get("picture")
       
        user = await self._user_repo.get_by_email(email)
        
        is_new_user = False
        if not user:
            user = User.create_google_user(
                email=email,
                first_name=first_name,
                last_name=last_name,
                google_sub=google_sub,
                avatar_url=google_user_avatar
            )
            is_new_user = True
        else:
            if user.auth_provider != 'google' or user.google_sub != google_sub:
                raise UserAlreadyExistsError(f"User with email {email} already exists with a different authentication method")

        tokens = self._auth_repo.create_tokens(user.id)
        return user, tokens, is_new_user
