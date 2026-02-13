"""Challenge domain entity — PvP quiz challenge with point wagering."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional


class ChallengeStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EXPIRED = "expired"
    DECLINED = "declined"
    CANCELLED = "cancelled"


@dataclass
class Challenge:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    challenger_id: uuid.UUID = field(default_factory=uuid.uuid4)
    opponent_id: uuid.UUID = field(default_factory=uuid.uuid4)
    document_id: uuid.UUID = field(default_factory=uuid.uuid4)
    quiz_id: Optional[uuid.UUID] = None
    question_count: int = 5
    wager_amount: int = 5
    status: ChallengeStatus = ChallengeStatus.PENDING
    challenger_score: Optional[float] = None
    opponent_score: Optional[float] = None
    winner_id: Optional[uuid.UUID] = None
    expires_at: datetime = field(default_factory=lambda: datetime.utcnow() + timedelta(hours=24))
    completed_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    # ── Constants ───────────────────────────────────────────────
    MIN_WAGER = 5
    ALLOWED_QUESTION_COUNTS = (5, 10, 15)
    TIMEOUT_HOURS = 24
    PERFECT_SCORE_BONUS = 10
    MAX_DAILY_CHALLENGES_PER_OPPONENT = 3

    # ── Business rules ──────────────────────────────────────────

    def validate_creation(self, challenger_points: int) -> None:
        if self.wager_amount < self.MIN_WAGER:
            raise ValueError(f"Minimum wager is {self.MIN_WAGER} points")
        if self.wager_amount > challenger_points:
            raise ValueError("Cannot wager more points than you have")
        if self.question_count not in self.ALLOWED_QUESTION_COUNTS:
            raise ValueError(f"Question count must be one of {self.ALLOWED_QUESTION_COUNTS}")
        if self.challenger_id == self.opponent_id:
            raise ValueError("Cannot challenge yourself")

    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at and self.status in (
            ChallengeStatus.PENDING,
            ChallengeStatus.ACCEPTED,
            ChallengeStatus.IN_PROGRESS,
        )

    def accept(self) -> None:
        if self.status != ChallengeStatus.PENDING:
            raise ValueError("Can only accept a pending challenge")
        self.status = ChallengeStatus.IN_PROGRESS
        self.updated_at = datetime.utcnow()

    def decline(self) -> None:
        if self.status != ChallengeStatus.PENDING:
            raise ValueError("Can only decline a pending challenge")
        self.status = ChallengeStatus.DECLINED
        self.updated_at = datetime.utcnow()

    def cancel(self) -> None:
        if self.status != ChallengeStatus.PENDING:
            raise ValueError("Can only cancel a pending challenge")
        self.status = ChallengeStatus.CANCELLED
        self.updated_at = datetime.utcnow()

    def expire(self) -> None:
        self.status = ChallengeStatus.EXPIRED
        self.updated_at = datetime.utcnow()

    def submit_score(self, user_id: uuid.UUID, score: float) -> None:
        if self.status != ChallengeStatus.IN_PROGRESS:
            raise ValueError("Challenge is not in progress")
        if user_id == self.challenger_id:
            self.challenger_score = score
        elif user_id == self.opponent_id:
            self.opponent_score = score
        else:
            raise ValueError("User is not part of this challenge")
        self.updated_at = datetime.utcnow()

    def resolve(self) -> None:
        """Determine winner after both scores are submitted."""
        if self.challenger_score is None or self.opponent_score is None:
            raise ValueError("Both scores must be submitted before resolving")

        if self.challenger_score > self.opponent_score:
            self.winner_id = self.challenger_id
        elif self.opponent_score > self.challenger_score:
            self.winner_id = self.opponent_id
        else:
            self.winner_id = None  # Tie

        self.status = ChallengeStatus.COMPLETED
        self.completed_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    @property
    def is_tie(self) -> bool:
        return self.status == ChallengeStatus.COMPLETED and self.winner_id is None

    @property
    def is_perfect_win(self) -> bool:
        if not self.winner_id:
            return False
        winner_score = (
            self.challenger_score if self.winner_id == self.challenger_id else self.opponent_score
        )
        return winner_score == 1.0  # 100%

    def loser_id(self) -> Optional[uuid.UUID]:
        if not self.winner_id:
            return None
        return self.opponent_id if self.winner_id == self.challenger_id else self.challenger_id
