"""Study session API router — start, heartbeat, end, stats."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import (get_current_user, get_leaderboard_service,
                                   get_study_session_repository)
from app.domain.entities.user import User
from app.domain.exceptions import StudySessionNotFoundError
from app.interfaces.repositories.study_session_repository import \
    IStudySessionRepository
from app.interfaces.services.leaderboard_service import ILeaderboardService
from app.schemas.response import success_response
from app.schemas.social import (StartSessionRequest, StudySessionResponse,
                                StudyStatsResponse)
from app.use_cases.study_sessions import (EndStudySessionUseCase,
                                          GetStudyStatsUseCase,
                                          HeartbeatUseCase,
                                          StartStudySessionUseCase)

router = APIRouter(prefix="/study-sessions", tags=["study-sessions"])


def _to_response(s) -> StudySessionResponse:
    return StudySessionResponse(
        id=s.id, user_id=s.user_id, document_id=s.document_id,
        started_at=s.started_at, last_heartbeat_at=s.last_heartbeat_at,
        ended_at=s.ended_at, duration_seconds=s.duration_seconds,
        is_active=s.is_active,
    )


@router.post("/", status_code=201)
async def start_session(
    body: StartSessionRequest,
    current_user: User = Depends(get_current_user),
    session_repo: IStudySessionRepository = Depends(get_study_session_repository),
    leaderboard: ILeaderboardService = Depends(get_leaderboard_service),
):
    use_case = StartStudySessionUseCase(session_repo, leaderboard)
    session = await use_case.execute(user_id=current_user.id, document_id=body.document_id)
    return success_response(
        data=_to_response(session).model_dump(mode="json"),
        message="Study session started",
    )


@router.post("/{session_id}/heartbeat")
async def heartbeat(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session_repo: IStudySessionRepository = Depends(get_study_session_repository),
):
    use_case = HeartbeatUseCase(session_repo)
    try:
        session = await use_case.execute(session_id=session_id, user_id=current_user.id)
    except StudySessionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return success_response(
        data=_to_response(session).model_dump(mode="json"),
        message="Heartbeat recorded",
    )


@router.post("/{session_id}/end")
async def end_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session_repo: IStudySessionRepository = Depends(get_study_session_repository),
    leaderboard: ILeaderboardService = Depends(get_leaderboard_service),
):
    use_case = EndStudySessionUseCase(session_repo, leaderboard)
    try:
        session = await use_case.execute(session_id=session_id, user_id=current_user.id)
    except StudySessionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return success_response(
        data=_to_response(session).model_dump(mode="json"),
        message="Study session ended",
    )


@router.get("/stats")
async def get_study_stats(
    current_user: User = Depends(get_current_user),
    session_repo: IStudySessionRepository = Depends(get_study_session_repository),
):
    use_case = GetStudyStatsUseCase(session_repo)
    stats = await use_case.execute(user_id=current_user.id)
    return success_response(
        data=StudyStatsResponse(
            total_seconds=stats["total_seconds"],
            total_minutes=stats["total_minutes"],
            total_hours=stats["total_hours"],
        ).model_dump(mode="json"),
        message="Study stats retrieved",
    )
