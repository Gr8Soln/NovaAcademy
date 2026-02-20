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


# ── Groups ──────────────────────────────────────────────────

class CreateGroupRequest(BaseModel):
    """Request to create a class/group."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    avatar_url: Optional[str] = None
    is_private: bool = False
    # Usernames of people to add at creation time (optional)
    initial_member_usernames: list[str] = Field(default_factory=list)


class UpdateGroupRequest(BaseModel):
    """Request to update group metadata (owner / admin only)."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    avatar_url: Optional[str] = None
    is_private: Optional[bool] = None


class GroupMemberResponse(BaseModel):
    user_id: UUID
    username: str
    role: str          # owner | admin | member
    joined_at: datetime


class GroupResponse(BaseModel):
    id: UUID
    name: str
    description: str
    avatar_url: Optional[str]
    is_private: bool
    created_by: UUID
    member_count: int
    members: list[GroupMemberResponse]
    created_at: datetime


class AddMemberRequest(BaseModel):
    """Add a member by username."""
    username: str


class ChangeMemberRoleRequest(BaseModel):
    """Promote or demote a member."""
    role: str = Field(..., pattern="^(admin|member)$")
