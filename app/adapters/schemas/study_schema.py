import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class StudySessionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    document_id: uuid.UUID
    class_id: Optional[uuid.UUID] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    last_heartbeat: datetime
    duration_seconds: int
    is_active: bool

    class Config:
        from_attributes = True


class StudyStatsResponse(BaseModel):
    total_study_seconds: int
    total_sessions: int
    class_stats: dict[str, int]  # class_id or "personal" -> seconds
