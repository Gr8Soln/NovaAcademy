"""Social feature schemas — notifications, challenges, leaderboard, study sessions, analytics."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

# ═══════════════════════════════════════════════════════════════
# Notifications
# ═══════════════════════════════════════════════════════════════

class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    title: str
    message: str
    data: dict[str, Any]
    is_read: bool
    created_at: datetime


class UnreadCountResponse(BaseModel):
    count: int


# ═══════════════════════════════════════════════════════════════
# Challenges
# ═══════════════════════════════════════════════════════════════

class CreateChallengeRequest(BaseModel):
    opponent_id: uuid.UUID
    document_id: uuid.UUID
    question_count: int = Field(5, description="Must be 5, 10, or 15")
    wager_amount: int = Field(5, ge=5)


class SubmitScoreRequest(BaseModel):
    score: float = Field(..., ge=0.0, le=1.0)


class ChallengeResponse(BaseModel):
    id: uuid.UUID
    challenger_id: uuid.UUID
    opponent_id: uuid.UUID
    document_id: uuid.UUID
    quiz_id: Optional[uuid.UUID]
    question_count: int
    wager_amount: int
    status: str
    challenger_score: Optional[float]
    opponent_score: Optional[float]
    winner_id: Optional[uuid.UUID]
    expires_at: datetime
    completed_at: Optional[datetime]
    created_at: datetime


# ═══════════════════════════════════════════════════════════════
# Points
# ═══════════════════════════════════════════════════════════════

class PointBalanceResponse(BaseModel):
    balance: int


class PointTransactionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    action: str
    points: int
    description: str
    reference_id: Optional[uuid.UUID]
    created_at: datetime


# ═══════════════════════════════════════════════════════════════
# Leaderboard
# ═══════════════════════════════════════════════════════════════

class LeaderboardEntryResponse(BaseModel):
    user_id: uuid.UUID
    score: float
    rank: int


# ═══════════════════════════════════════════════════════════════
# Study Sessions
# ═══════════════════════════════════════════════════════════════

class StartSessionRequest(BaseModel):
    document_id: uuid.UUID


class StudySessionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    document_id: uuid.UUID
    started_at: datetime
    last_heartbeat_at: datetime
    ended_at: Optional[datetime]
    duration_seconds: int
    is_active: bool


class StudyStatsResponse(BaseModel):
    total_seconds: int
    total_minutes: int
    total_hours: int


# ═══════════════════════════════════════════════════════════════
# Analytics
# ═══════════════════════════════════════════════════════════════

class UserAnalyticsResponse(BaseModel):
    total_points: int
    total_study_seconds: int
    total_quizzes: int
    total_challenges: int
