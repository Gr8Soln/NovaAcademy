from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class SendMessageRequest(BaseModel):
    """Request to send a message."""
    group_id: UUID
    content: str
    message_type: str = "text"
    reply_to_id: Optional[UUID] = None


class MessageResponse(BaseModel):
    """ChatMessage response."""
    id: UUID
    group_id: UUID
    sender_id: UUID
    content: str
    message_type: str
    mentions: list[dict]
    created_at: datetime
    edited_at: Optional[datetime]
    is_deleted: bool
    reply_to_id: Optional[UUID]


class EditMessageRequest(BaseModel):
    """Request to edit a message."""
    content: str
