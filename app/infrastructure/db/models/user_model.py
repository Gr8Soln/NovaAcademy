from typing import Optional

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db import Base


class UserModel(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    first_name: Mapped[str] = mapped_column(String(256))
    last_name: Mapped[str] = mapped_column(String(256))
    hashed_password: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    has_password: Mapped[Optional[bool]] = mapped_column(default=False)
    is_email_verified: Mapped[Optional[bool]] = mapped_column(default=False)
    auth_provider: Mapped[str] = mapped_column(String(16), default="email")
    google_sub: Mapped[Optional[str]] = mapped_column(String(256), unique=True, nullable=True, index=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    
    


