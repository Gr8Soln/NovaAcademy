from fastapi import APIRouter, Depends

from app.adapters.schemas import success_response
from app.application.use_cases.study_usecases import GetStudyStatsUseCase
from app.domain.entities import User
from app.infrastructure.api.dependencies import (get_current_user,
                                                 get_study_stats_usecase)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/me")
async def get_my_analytics(
    current_user: User = Depends(get_current_user),
    stats_use_case: GetStudyStatsUseCase = Depends(get_study_stats_usecase),
):
    """
    Get consolidated analytics for the current user.
    Note: In a full implementation, this might combine data from quizzes, etc.
    For now, it returns the core study stats.
    """
    stats = await stats_use_case.execute(user_id=current_user.id)

    # Mock some extra analytics fields to match frontend expectations if needed
    # (Trophy icons, accuracy, etc from the implementation plan)
    analytics_data = {
        "total_points": 0, # Placeholder
        "total_study_seconds": stats["total_study_seconds"],
        "total_quizzes": 0, # Placeholder
    }
    
    return success_response(
        message="Analytics retrieved",
        data=analytics_data
    )
