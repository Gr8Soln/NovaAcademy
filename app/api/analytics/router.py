"""Analytics API router — aggregated student dashboard stats."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.dependencies import (get_challenge_repository, get_current_user,
                                   get_follow_repository,
                                   get_point_transaction_repository,
                                   get_post_repository, get_quiz_repository,
                                   get_study_session_repository)
from app.domain.entities.user import User
from app.interfaces.repositories.challenge_repository import \
    IChallengeRepository
from app.interfaces.repositories.follow_repository import IFollowRepository
from app.interfaces.repositories.point_transaction_repository import \
    IPointTransactionRepository
from app.interfaces.repositories.post_repository import IPostRepository
from app.interfaces.repositories.quiz_repository import IQuizRepository
from app.interfaces.repositories.study_session_repository import \
    IStudySessionRepository
from app.schemas.response import success_response
from app.schemas.social import UserAnalyticsResponse
from app.use_cases.analytics import GetUserAnalyticsUseCase

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/me")
async def get_my_analytics(
    current_user: User = Depends(get_current_user),
    point_repo: IPointTransactionRepository = Depends(get_point_transaction_repository),
    follow_repo: IFollowRepository = Depends(get_follow_repository),
    post_repo: IPostRepository = Depends(get_post_repository),
    challenge_repo: IChallengeRepository = Depends(get_challenge_repository),
    session_repo: IStudySessionRepository = Depends(get_study_session_repository),
    quiz_repo: IQuizRepository = Depends(get_quiz_repository),
):
    use_case = GetUserAnalyticsUseCase(
        point_repo, follow_repo, post_repo, challenge_repo, session_repo, quiz_repo
    )
    analytics = await use_case.execute(current_user.id)
    return success_response(
        data=UserAnalyticsResponse(
            total_points=analytics.total_points,
            followers_count=analytics.followers_count,
            following_count=analytics.following_count,
            total_posts=analytics.total_posts,
            total_study_seconds=analytics.total_study_seconds,
            total_quizzes=analytics.total_quizzes,
            total_challenges=analytics.total_challenges,
        ).model_dump(mode="json"),
        message="Analytics retrieved",
    )
