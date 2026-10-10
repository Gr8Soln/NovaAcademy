import uuid
from typing import List, Optional

from app.application.interfaces.study_session_interface import IStudySessionInterface
from app.domain.entities.study_session_entity import StudySession


class StartStudySessionUseCase:
    def __init__(self, study_repo: IStudySessionInterface) -> None:
        self._study_repo = study_repo

    async def execute(
        self, 
        user_id: uuid.UUID, 
        document_id: uuid.UUID, 
        class_id: Optional[uuid.UUID] = None
    ) -> StudySession:
        # Check if there is already an active session for this user
        active = await self._study_repo.get_active_by_user(user_id)
        
        # If active session is for the same document/class, return it
        if active and active.document_id == document_id and active.class_id == class_id:
            return active
            
        # If there's a different active session, end it first
        if active:
            active.end()
            await self._study_repo.update(active)
            
        # Start new session
        new_session = StudySession(
            user_id=user_id,
            document_id=document_id,
            class_id=class_id
        )
        return await self._study_repo.create(new_session)


class UpdateStudySessionHeartbeatUseCase:
    def __init__(self, study_repo: IStudySessionInterface) -> None:
        self._study_repo = study_repo

    async def execute(self, session_id: uuid.UUID, user_id: uuid.UUID) -> StudySession:
        session = await self._study_repo.get_by_id(session_id)
        if not session or session.user_id != user_id:
            raise ValueError("Study session not found")
            
        if not session.is_active:
             # If resuming a closed session, we might want to start a new one instead 
             # but for now let's just error or reopen. 
             # Reopening might be complex for analytics, so we'll treat it as "not found" 
             # and the client should start a new one.
             raise ValueError("Study session is no longer active")
             
        session.update_heartbeat()
        return await self._study_repo.update(session)


class EndStudySessionUseCase:
    def __init__(self, study_repo: IStudySessionInterface) -> None:
        self._study_repo = study_repo

    async def execute(self, session_id: uuid.UUID, user_id: uuid.UUID) -> StudySession:
        session = await self._study_repo.get_by_id(session_id)
        if not session or session.user_id != user_id:
            raise ValueError("Study session not found")
            
        session.end()
        return await self._study_repo.update(session)


class GetStudyStatsUseCase:
    def __init__(self, study_repo: IStudySessionInterface) -> None:
        self._study_repo = study_repo

    async def execute(self, user_id: uuid.UUID) -> dict:
        total = await self._study_repo.get_total_duration(user_id)
        sessions = await self._study_repo.list_by_user(user_id, limit=1000)
        
        class_stats = {}
        for s in sessions:
            key = str(s.class_id) if s.class_id else "personal"
            class_stats[key] = class_stats.get(key, 0) + s.duration_seconds
            
        return {
            "total_study_seconds": total,
            "total_sessions": len(sessions),
            "class_stats": class_stats
        }
