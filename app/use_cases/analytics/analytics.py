"""Analytics use case — aggregate user stats for dashboard."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from app.interfaces.repositories.challenge_repository import \
    IChallengeRepository
from app.interfaces.repositories.point_transaction_repository import \
    IPointTransactionRepository
from app.interfaces.repositories.quiz_repository import IQuizRepository
from app.interfaces.repositories.study_session_repository import \
    IStudySessionRepository


@dataclass
class UserAnalytics:
    total_points: int = 0
    total_study_seconds: int = 0
    total_quizzes: int = 0
    total_challenges: int = 0


class GetUserAnalyticsUseCase:
    def __init__(
        self,
        point_repo: IPointTransactionRepository,
        challenge_repo: IChallengeRepository,
        session_repo: IStudySessionRepository,
        quiz_repo: IQuizRepository,
    ) -> None:
        self._point_repo = point_repo
        self._challenge_repo = challenge_repo
        self._session_repo = session_repo
        self._quiz_repo = quiz_repo

    async def execute(self, user_id: uuid.UUID) -> UserAnalytics:
        points = await self._point_repo.get_balance(user_id)
        study_seconds = await self._session_repo.get_total_seconds(user_id)
        quizzes = await self._quiz_repo.list_by_user(user_id, offset=0, limit=0)
        challenges = await self._challenge_repo.get_user_challenges(user_id, offset=0, limit=0)

        return UserAnalytics(
            total_points=points,
            total_study_seconds=study_seconds,
            total_quizzes=len(quizzes),
            total_challenges=len(challenges),
        )
