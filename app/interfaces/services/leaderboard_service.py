"""Abstract leaderboard service interface — realtime ranking via Redis."""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class LeaderboardType(str, Enum):
    POINTS = "points"
    STUDY_TIME = "study_time"


class LeaderboardPeriod(str, Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ALL_TIME = "all_time"


@dataclass
class LeaderboardEntry:
    user_id: uuid.UUID
    score: float
    rank: int


class ILeaderboardService(ABC):

    @abstractmethod
    async def increment_score(
        self, user_id: uuid.UUID, board_type: LeaderboardType, amount: float
    ) -> None:
        """Increment a user's score on the given leaderboard."""
        ...

    @abstractmethod
    async def get_rank(
        self, user_id: uuid.UUID, board_type: LeaderboardType, period: LeaderboardPeriod
    ) -> Optional[LeaderboardEntry]:
        """Get a specific user's rank and score."""
        ...

    @abstractmethod
    async def get_top(
        self, board_type: LeaderboardType, period: LeaderboardPeriod, limit: int = 100
    ) -> list[LeaderboardEntry]:
        """Get top N entries for a leaderboard."""
        ...

    @abstractmethod
    async def get_around_user(
        self, user_id: uuid.UUID, board_type: LeaderboardType, period: LeaderboardPeriod, count: int = 5
    ) -> list[LeaderboardEntry]:
        """Get entries around a specific user's rank."""
        ...
