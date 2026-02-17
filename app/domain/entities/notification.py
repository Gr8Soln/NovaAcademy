import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Optional


class NotificationType(str, Enum):
    NEW_FOLLOWER = "new_follower"
    NEW_POST = "new_post"
    POST_LIKE = "post_like"
    POST_COMMENT = "post_comment"
    CHALLENGE_RECEIVED = "challenge_received"
    CHALLENGE_ACCEPTED = "challenge_accepted"
    CHALLENGE_COMPLETED = "challenge_completed"
    CHALLENGE_EXPIRED = "challenge_expired"
    POINTS_EARNED = "points_earned"
    STREAK_MILESTONE = "streak_milestone"
    FOLLOWER_MILESTONE = "follower_milestone"


@dataclass
class Notification:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    user_id: uuid.UUID = field(default_factory=uuid.uuid4)
    type: NotificationType = NotificationType.NEW_FOLLOWER
    title: str = ""
    message: str = ""
    data: dict[str, Any] = field(default_factory=dict)
    is_read: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)

    def mark_as_read(self) -> None:
        self.is_read = True
