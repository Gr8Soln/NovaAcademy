"""Analytics use case — aggregate user stats for dashboard."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from app.interfaces.repositories.challenge_repository import \
    IChallengeRepository
from app.interfaces.repositories.follow_repository import IFollowRepository
from app.interfaces.repositories.point_transaction_repository import \
    IPointTransactionRepository
from app.interfaces.repositories.post_repository import IPostRepository
from app.interfaces.repositories.quiz_repository import IQuizRepository
from app.interfaces.repositories.study_session_repository import \
    IStudySessionRepository


@dataclass
class UserAnalytics:
    total_points: int = 0
    followers_count: int = 0
    following_count: int = 0
    total_posts: int = 0
    total_study_seconds: int = 0
    total_quizzes: int = 0
    total_challenges: int = 0


class GetUserAnalyticsUseCase:
    def __init__(
        self,
        point_repo: IPointTransactionRepository,
        follow_repo: IFollowRepository,
        post_repo: IPostRepository,
        challenge_repo: IChallengeRepository,
        session_repo: IStudySessionRepository,
        quiz_repo: IQuizRepository,
    ) -> None:
        self._point_repo = point_repo
        self._follow_repo = follow_repo
        self._post_repo = post_repo
        self._challenge_repo = challenge_repo
        self._session_repo = session_repo
        self._quiz_repo = quiz_repo

    async def execute(self, user_id: uuid.UUID) -> UserAnalytics:
        points = await self._point_repo.get_balance(user_id)
        followers = await self._follow_repo.count_followers(user_id)
        following = await self._follow_repo.count_following(user_id)
        posts = await self._post_repo.count_user_posts(user_id)
        study_seconds = await self._session_repo.get_total_seconds(user_id)
        quizzes = await self._quiz_repo.list_by_user(user_id, offset=0, limit=0)
        challenges = await self._challenge_repo.get_user_challenges(user_id, offset=0, limit=0)

        return UserAnalytics(
            total_points=points,
            followers_count=followers,
            following_count=following,
            total_posts=posts,
            total_study_seconds=study_seconds,
            total_quizzes=len(quizzes),
            total_challenges=len(challenges),
        )
