from app.application.dtos import AuthProvider
from app.domain.entities import User
from app.infrastructure.db.models.user_model import UserModel

# ── User ────────────────────────────────────────────────────────

def user_model_to_entity(m: UserModel) -> User:
    return User(
        id=m.id,
        email=m.email,
        first_name=m.first_name,
        last_name=m.last_name,
        hashed_password=m.hashed_password,
        auth_provider=AuthProvider(m.auth_provider),
        google_sub=m.google_sub,
        avatar_url=m.avatar_url,
        has_password=m.has_password,
        is_active=m.is_active,
        is_email_verified=m.is_email_verified,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


def user_entity_to_model(e: User) -> UserModel:
    return UserModel(
        id=e.id,
        email=e.email,
        first_name=e.first_name,
        last_name=e.last_name,
        hashed_password=e.hashed_password,
        auth_provider=e.auth_provider.value,
        google_sub=e.google_sub,
        avatar_url=e.avatar_url,
        has_password=e.has_password,
        is_active=e.is_active,
        is_email_verified=e.is_email_verified,
        created_at=e.created_at,
        updated_at=e.updated_at,
    )

