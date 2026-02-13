"""Point transaction domain entity — ledger of all point changes."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class PointAction(str, Enum):
    # Documents
    DOCUMENT_UPLOAD = "document_upload"
    DOCUMENT_PROCESSED = "document_processed"
    DOCUMENT_MILESTONE_1 = "document_milestone_1"
    DOCUMENT_MILESTONE_10 = "document_milestone_10"

    # AI Study
    ASK_QUESTION = "ask_question"
    GENERATE_SUMMARY = "generate_summary"
    GENERATE_FLASHCARDS = "generate_flashcards"
    REVIEW_FLASHCARDS = "review_flashcards"

    # Quizzes
    QUIZ_COMPLETE = "quiz_complete"
    QUIZ_SCORE_80 = "quiz_score_80"
    QUIZ_PERFECT = "quiz_perfect"
    QUIZ_IMPROVEMENT = "quiz_improvement"
    QUIZ_STREAK = "quiz_streak"

    # Consistency
    DAILY_LOGIN = "daily_login"
    DAILY_STUDY = "daily_study"
    STREAK_7_DAY = "streak_7_day"
    STREAK_30_DAY = "streak_30_day"
    PERSONAL_BEST = "personal_best"

    # Social
    GAINED_FOLLOWER = "gained_follower"
    FOLLOWER_MILESTONE_10 = "follower_milestone_10"
    FOLLOWER_MILESTONE_50 = "follower_milestone_50"
    DOCUMENT_SHARED = "document_shared"
    POST_LIKED = "post_liked"
    FIRST_POST = "first_post"

    # Challenges
    CHALLENGE_WIN = "challenge_win"
    CHALLENGE_PERFECT_WIN = "challenge_perfect_win"
    CHALLENGE_LOSS = "challenge_loss"
    CHALLENGE_ESCROW = "challenge_escrow"
    CHALLENGE_ESCROW_RETURN = "challenge_escrow_return"
    CHALLENGE_TIE_RETURN = "challenge_tie_return"


# Default point values for each action
POINT_VALUES: dict[PointAction, int] = {
    PointAction.DOCUMENT_UPLOAD: 5,
    PointAction.DOCUMENT_PROCESSED: 3,
    PointAction.DOCUMENT_MILESTONE_1: 10,
    PointAction.DOCUMENT_MILESTONE_10: 25,
    PointAction.ASK_QUESTION: 2,
    PointAction.GENERATE_SUMMARY: 3,
    PointAction.GENERATE_FLASHCARDS: 3,
    PointAction.REVIEW_FLASHCARDS: 5,
    PointAction.QUIZ_COMPLETE: 10,
    PointAction.QUIZ_SCORE_80: 10,
    PointAction.QUIZ_PERFECT: 25,
    PointAction.QUIZ_IMPROVEMENT: 5,
    # QUIZ_STREAK is 5 × streak_level, calculated dynamically
    PointAction.DAILY_LOGIN: 2,
    PointAction.DAILY_STUDY: 5,
    PointAction.STREAK_7_DAY: 20,
    PointAction.STREAK_30_DAY: 100,
    PointAction.PERSONAL_BEST: 15,
    PointAction.GAINED_FOLLOWER: 2,
    PointAction.FOLLOWER_MILESTONE_10: 15,
    PointAction.FOLLOWER_MILESTONE_50: 50,
    PointAction.DOCUMENT_SHARED: 5,
    PointAction.POST_LIKED: 1,
    PointAction.FIRST_POST: 5,
    PointAction.CHALLENGE_PERFECT_WIN: 10,  # bonus on top of wager
}


@dataclass
class PointTransaction:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    user_id: uuid.UUID = field(default_factory=uuid.uuid4)
    action: PointAction = PointAction.DAILY_LOGIN
    points: int = 0  # positive = earned, negative = deducted
    description: str = ""
    reference_id: Optional[uuid.UUID] = None  # FK to related entity
    created_at: datetime = field(default_factory=datetime.utcnow)
