import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional


@dataclass
class StudySession:
    """
    Represents an active or completed study session.
    
    Tracks engagement with a specific document, potentially within a class context.
    """
    user_id: uuid.UUID
    document_id: uuid.UUID
    class_id: Optional[uuid.UUID] = None
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    start_time: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    last_heartbeat: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    duration_seconds: int = 0
    is_active: bool = True

    def update_heartbeat(self) -> None:
        """Record activity and update accumulated duration."""
        if not self.is_active:
            return
            
        now = datetime.now(timezone.utc)
        delta = (now - self.last_heartbeat).total_seconds()
        
        # Only increment if the heartbeat is reasonable (e.g. within 5 minutes)
        # to avoid jumps if the user left the tab open and then came back
        if delta < 300: 
            self.duration_seconds += int(delta)
            
        self.last_heartbeat = now

    def end(self) -> None:
        """Finalize the session."""
        if not self.is_active:
            return
            
        self.update_heartbeat()
        self.end_time = datetime.now(timezone.utc)
        self.is_active = False
