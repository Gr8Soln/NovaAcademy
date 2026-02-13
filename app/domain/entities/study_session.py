"""Study session domain entity — tracks active study time."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class StudySession:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    user_id: uuid.UUID = field(default_factory=uuid.uuid4)
    document_id: uuid.UUID = field(default_factory=uuid.uuid4)
    started_at: datetime = field(default_factory=datetime.utcnow)
    last_heartbeat_at: datetime = field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    duration_seconds: int = 0
    is_active: bool = True

    # ── Constants ───────────────────────────────────────────────
    HEARTBEAT_INTERVAL_SECONDS = 30
    PAUSE_THRESHOLD_SECONDS = 120  # 2 minutes without heartbeat

    # ── Business rules ──────────────────────────────────────────

    def heartbeat(self) -> None:
        """Update last heartbeat, accumulate duration."""
        now = datetime.utcnow()
        elapsed = (now - self.last_heartbeat_at).total_seconds()
        # Only count time if heartbeat is within the pause threshold
        if elapsed <= self.PAUSE_THRESHOLD_SECONDS:
            self.duration_seconds += int(elapsed)
        self.last_heartbeat_at = now

    def end(self) -> None:
        now = datetime.utcnow()
        elapsed = (now - self.last_heartbeat_at).total_seconds()
        if elapsed <= self.PAUSE_THRESHOLD_SECONDS:
            self.duration_seconds += int(elapsed)
        self.ended_at = now
        self.is_active = False
