from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

# ── Messages ────────────────────────────────────────────────

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


# ── Classes (formerly Groups) ───────────────────────────────

class UpdateClassRequest(BaseModel):
    """Request to update class metadata (owner / admin only)."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    is_private: Optional[bool] = None


class ClassMemberResponse(BaseModel):
    user_id: UUID
    username: str
    role: str          # owner | admin | member
    joined_at: datetime


class ClassResponse(BaseModel):
    id: UUID
    code: str
    name: str
    description: str
    avatar_url: Optional[str]
    is_private: bool
    created_by: UUID
    member_count: int
    members: list[ClassMemberResponse]
    created_at: datetime


class AddMemberRequest(BaseModel):
    """Add a member by username."""
    username: str


class ChangeMemberRoleRequest(BaseModel):
    """Promote or demote a member."""
    role: str = Field(..., pattern="^(admin|member)$")


# ── Join Requests ───────────────────────────────────────────

class JoinRequestResponse(BaseModel):
    id: UUID
    class_id: UUID
    user_id: UUID
    username: str
    status: str
    created_at: datetime


class HandleJoinRequestRequest(BaseModel):
    """Accept or reject a join request."""
    action: str = Field(..., pattern="^(accept|reject)$")
