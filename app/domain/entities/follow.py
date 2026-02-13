"""Follow domain entity — one-way follow relationship."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Follow:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    follower_id: uuid.UUID = field(default_factory=uuid.uuid4)
    following_id: uuid.UUID = field(default_factory=uuid.uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)

    def is_mutual(self, reverse_exists: bool) -> bool:
        """Returns True if the other user also follows this user (study buddy)."""
        return reverse_exists
