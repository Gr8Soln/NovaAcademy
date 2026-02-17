from app.application.dtos import TokenPair
from app.application.interfaces import IAuthInterface, IUserInterface
from app.domain.entities import User
from app.domain.exceptions import UserAlreadyExistsError


class RegisterUseCase:
    def __init__(self, user_repo: IUserInterface, auth_repo: IAuthInterface) -> None:
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
