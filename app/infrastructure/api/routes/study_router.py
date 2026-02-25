from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel

from app.adapters.schemas import success_response
from app.adapters.schemas.study_schema import StudySessionResponse, StudyStatsResponse
from app.application.use_cases.study_usecases import (
    StartStudySessionUseCase, UpdateStudySessionHeartbeatUseCase,
    EndStudySessionUseCase, GetStudyStatsUseCase
)
from app.domain.entities import User
from app.infrastructure.api.dependencies import (
    get_current_user, get_start_study_session_usecase,
    get_update_heartbeat_usecase, get_end_study_session_usecase,
    get_study_stats_usecase
)

router = APIRouter(prefix="/study-sessions", tags=["Study Sessions"])


class StartSessionRequest(BaseModel):
    document_id: UUID
    class_id: Optional[UUID] = None


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def start_session(
    request: StartSessionRequest,
    current_user: User = Depends(get_current_user),
    use_case: StartStudySessionUseCase = Depends(get_start_study_session_usecase),
):
    """Start a new study session or resume an active one for the same document."""
    session = await use_case.execute(
        user_id=current_user.id,
        document_id=request.document_id,
        class_id=request.class_id
    )
    return success_response(
        message="Study session started",
        data=StudySessionResponse.model_validate(session).model_dump(mode="json")
    )


@router.post("/{session_id}/heartbeat", response_model=dict)
async def heartbeat(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    use_case: UpdateStudySessionHeartbeatUseCase = Depends(get_update_heartbeat_usecase),
):
    """Send a heartbeat to keep the study session active and update duration."""
    try:
        session = await use_case.execute(session_id=session_id, user_id=current_user.id)
        return success_response(
            message="Heartbeat recorded",
            data=StudySessionResponse.model_validate(session).model_dump(mode="json")
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{session_id}/end", response_model=dict)
async def end_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    use_case: EndStudySessionUseCase = Depends(get_end_study_session_usecase),
):
    """End a study session."""
    try:
        session = await use_case.execute(session_id=session_id, user_id=current_user.id)
        return success_response(
            message="Study session ended",
            data=StudySessionResponse.model_validate(session).model_dump(mode="json")
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/stats", response_model=dict)
async def get_stats(
    current_user: User = Depends(get_current_user),
    use_case: GetStudyStatsUseCase = Depends(get_study_stats_usecase),
):
    """Get summarized study statistics for the user."""
    stats = await use_case.execute(user_id=current_user.id)
    return success_response(
        message="Study statistics retrieved",
        data=StudyStatsResponse.model_validate(stats).model_dump(mode="json")
    )
