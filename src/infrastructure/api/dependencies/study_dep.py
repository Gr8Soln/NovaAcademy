from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.repositories import SQLStudySessionRepository
from src.application.interfaces import IStudySessionInterface
from src.application.use_cases.study_usecases import (
    StartStudySessionUseCase, UpdateStudySessionHeartbeatUseCase,
    EndStudySessionUseCase, GetStudyStatsUseCase
)
from src.infrastructure.db import get_db_session


def get_study_session_repository(
    session: AsyncSession = Depends(get_db_session),
) -> IStudySessionInterface:
    return SQLStudySessionRepository(session)


def get_start_study_session_usecase(
    study_repo: IStudySessionInterface = Depends(get_study_session_repository),
) -> StartStudySessionUseCase:
    return StartStudySessionUseCase(study_repo=study_repo)


def get_update_heartbeat_usecase(
    study_repo: IStudySessionInterface = Depends(get_study_session_repository),
) -> UpdateStudySessionHeartbeatUseCase:
    return UpdateStudySessionHeartbeatUseCase(study_repo=study_repo)


def get_end_study_session_usecase(
    study_repo: IStudySessionInterface = Depends(get_study_session_repository),
) -> EndStudySessionUseCase:
    return EndStudySessionUseCase(study_repo=study_repo)


def get_study_stats_usecase(
    study_repo: IStudySessionInterface = Depends(get_study_session_repository),
) -> GetStudyStatsUseCase:
    return GetStudyStatsUseCase(study_repo=study_repo)
