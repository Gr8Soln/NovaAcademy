"""Study session use cases — start, heartbeat, end, stats."""

from __future__ import annotations

import uuid

from app.domain.entities.study_session import StudySession
from app.domain.exceptions import StudySessionNotFoundError
from app.interfaces.repositories.study_session_repository import \
    IStudySessionRepository
from app.interfaces.services.leaderboard_service import (ILeaderboardService,
                                                         LeaderboardType)


class StartStudySessionUseCase:
    def __init__(
        self,
        session_repo: IStudySessionRepository,
        leaderboard_service: ILeaderboardService,
    ) -> None:
        self._session_repo = session_repo
        self._leaderboard = leaderboard_service

    async def execute(self, user_id: uuid.UUID, document_id: uuid.UUID) -> StudySession:
        # End any existing active session first
        active = await self._session_repo.get_active_session(user_id)
        if active:
            active.end()
            await self._session_repo.update(active)
            # Credit the completed session's time to leaderboard
            await self._leaderboard.increment_score(
                user_id, LeaderboardType.STUDY_TIME, active.duration_seconds
            )

        session = StudySession(user_id=user_id, document_id=document_id)
        return await self._session_repo.create(session)


class HeartbeatUseCase:
    def __init__(self, session_repo: IStudySessionRepository) -> None:
        self._session_repo = session_repo

    async def execute(self, session_id: uuid.UUID, user_id: uuid.UUID) -> StudySession:
        session = await self._session_repo.get_by_id(session_id)
        if not session or session.user_id != user_id:
            raise StudySessionNotFoundError("Session not found")
        if not session.is_active:
            raise StudySessionNotFoundError("Session already ended")
        session.heartbeat()
        return await self._session_repo.update(session)


class EndStudySessionUseCase:
    def __init__(
        self,
        session_repo: IStudySessionRepository,
        leaderboard_service: ILeaderboardService,
    ) -> None:
        self._session_repo = session_repo
        self._leaderboard = leaderboard_service

    async def execute(self, session_id: uuid.UUID, user_id: uuid.UUID) -> StudySession:
        session = await self._session_repo.get_by_id(session_id)
        if not session or session.user_id != user_id:
            raise StudySessionNotFoundError("Session not found")
        session.end()
        result = await self._session_repo.update(session)
        # Credit study time to leaderboard
        await self._leaderboard.increment_score(
            user_id, LeaderboardType.STUDY_TIME, session.duration_seconds
        )
        return result


class GetStudyStatsUseCase:
    def __init__(self, session_repo: IStudySessionRepository) -> None:
        self._session_repo = session_repo

    async def execute(self, user_id: uuid.UUID) -> dict:
        total_seconds = await self._session_repo.get_total_seconds(user_id)
        sessions = await self._session_repo.get_user_sessions(user_id, offset=0, limit=10)
        return {
            "total_seconds": total_seconds,
            "total_minutes": total_seconds // 60,
            "total_hours": total_seconds // 3600,
            "recent_sessions": sessions,
        }
