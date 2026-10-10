import pytest
from unittest.mock import AsyncMock, MagicMock

from src.application.use_cases.auth_usecases import RegisterUseCase, LoginUseCase
from src.application.dtos import TokenPair, AuthProvider
from src.domain.entities import User
from src.application.interfaces import IUserInterface, IJwtService, IEmailService
from src.core.config import settings

class MockUserRepo(IUserInterface):
    def __init__(self):
        self.users = {}
        self.by_username = {}

    async def get_by_email(self, email: str):
        return self.users.get(email)

    async def get_by_username(self, username: str):
        return self.by_username.get(username)

    async def create(self, user: User):
        self.users[user.email] = user
        if user.username:
            self.by_username[user.username] = user
        return user

    async def get_by_id(self, uid):
        for u in self.users.values():
            if u.id == uid:
                return u
        return None

class MockJwtService(IJwtService):
    def hash_password(self, pwd: str) -> str:
        return f"hashed-{pwd}"
    def verify_password(self, pwd: str, hashed: str) -> bool:
        return hashed == f"hashed-{pwd}"
    def create_tokens(self, user_id):
        return TokenPair(access_token="a", refresh_token="r")
    def create_email_verification_token(self, uid):
        return "verify-token"
    def decode_refresh_token(self, token):
        return settings.SECRET_KEY
    def decode_password_reset_token(self, token):
        return settings.SECRET_KEY
    def decode_email_verification_token(self, token):
        return settings.SECRET_KEY

class MockEmailService(IEmailService):
    async def send_verification_email(self, email, first_name, token):
        return
    async def send_password_reset_email(self, email, first_name, token):
        return

@pytest.mark.asyncio
async def test_register_and_login_email_flow():
    repo = MockUserRepo()
    auth = MockJwtService()
    email_svc = MockEmailService()
    register_uc = RegisterUseCase(user_repo=repo, auth_repo=auth, email_svc=email_svc)
    user, tokens = await register_uc.execute("test@example.com", "John", "Doe", "secret")
    assert user.email == "test@example.com"
    assert user.hashed_password == "hashed-secret"
    assert user.auth_provider == AuthProvider.EMAIL
    assert tokens.access_token == "a"
    login_uc = LoginUseCase(user_repo=repo, auth_repo=auth)
    logged_user, logged_tokens = await login_uc.execute("test@example.com", "secret")
    assert logged_user.id == user.id
    assert logged_tokens.access_token == "a"

@pytest.mark.asyncio
async def test_login_invalid_auth_method_raises():
    repo = MockUserRepo()
    auth = MockJwtService()
    # create a Google user directly
    google_user = User.create_google_user(
        email="g@example.com",
        first_name="G",
        last_name="User",
        google_sub="sub123",
        username="guser",
    )
    # manually insert
    repo.users[google_user.email] = google_user
    login_uc = LoginUseCase(user_repo=repo, auth_repo=auth)
    with pytest.raises(Exception) as exc:
        await login_uc.execute("g@example.com", "doesntmatter")
    # The specific exception type is InvalidAuthMethodError
    from src.application.use_cases.auth_usecases import InvalidAuthMethodError
    assert isinstance(exc.value, InvalidAuthMethodError)
