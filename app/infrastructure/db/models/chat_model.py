import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import Base


class MessageModel(Base):
    __tablename__ = "messages"

    group_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    message_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="text"
    )
    edited_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_deleted: Mapped[bool] = mapped_column(nullable=False, default=False)
    reply_to_id: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True)
    metadata_: Mapped[Optional[dict[str, Any]]] = mapped_column(
        "metadata", JSON, nullable=True
    )

    # Relationships
    mentions: Mapped[list["MessageMentionModel"]] = relationship(
        back_populates="message", cascade="all, delete-orphan"
    )
    group: Mapped["GroupModel"] = relationship(back_populates="messages")

    __table_args__ = (
        # Composite index for pagination queries
        # Index("idx_messages_group_created", "group_id", "created_at"),
    )


class MessageMentionModel(Base):
    __tablename__ = "message_mentions"

    message_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("messages.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    start_index: Mapped[int] = mapped_column(Integer, nullable=False)
    end_index: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    message: Mapped["MessageModel"] = relationship(back_populates="mentions")


class GroupModel(Base):
    """SQLAlchemy model for chat groups."""

    __tablename__ = "groups"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )
    is_private: Mapped[bool] = mapped_column(nullable=False, default=False)
    max_members: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1000
    )

    # Relationships
    members: Mapped[list["GroupMemberModel"]] = relationship(
        back_populates="group", cascade="all, delete-orphan"
    )
    messages: Mapped[list["MessageModel"]] = relationship(
        back_populates="group", cascade="all, delete-orphan"
    )


class GroupMemberModel(Base):
    """SQLAlchemy model for group members."""

    __tablename__ = "group_members"

    group_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("groups.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default="member"
    )  # owner, admin, member
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    last_read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_muted: Mapped[bool] = mapped_column(nullable=False, default=False)

    # Relationships
    group: Mapped["GroupModel"] = relationship(back_populates="members")

    # Composite unique constraint: one user can only be in a group once
    __table_args__ = (
        # UniqueConstraint("group_id", "user_id", name="uq_group_user"),
    )

