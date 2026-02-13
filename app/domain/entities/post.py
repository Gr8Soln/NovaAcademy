"""Post domain entity — student tweets / status updates."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class PostType(str, Enum):
    MANUAL = "manual"
    AUTO = "auto"


@dataclass
class Post:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    user_id: uuid.UUID = field(default_factory=uuid.uuid4)
    content: str = ""
    post_type: PostType = PostType.MANUAL
    like_count: int = 0
    impression_count: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)

    # ── Business rules ──────────────────────────────────────────

    MAX_LENGTH = 280

    def validate_content(self) -> None:
        if not self.content or not self.content.strip():
            raise ValueError("Post content cannot be empty")
        if len(self.content) > self.MAX_LENGTH:
            raise ValueError(f"Post content cannot exceed {self.MAX_LENGTH} characters")

    def increment_likes(self) -> None:
        self.like_count += 1

    def decrement_likes(self) -> None:
        if self.like_count > 0:
            self.like_count -= 1

    def increment_impressions(self) -> None:
        self.impression_count += 1

    @staticmethod
    def create_manual(user_id: uuid.UUID, content: str) -> "Post":
        post = Post(user_id=user_id, content=content, post_type=PostType.MANUAL)
        post.validate_content()
        return post

    @staticmethod
    def create_auto(user_id: uuid.UUID, content: str) -> "Post":
        return Post(user_id=user_id, content=content, post_type=PostType.AUTO)


@dataclass
class PostLike:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    post_id: uuid.UUID = field(default_factory=uuid.uuid4)
    user_id: uuid.UUID = field(default_factory=uuid.uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)
