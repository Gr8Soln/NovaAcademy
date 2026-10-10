import random
import string
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from app.application.dtos import ChatGroupRole, MessageType

_CODE_CHARS = string.ascii_letters + string.digits  # A-Z, a-z, 0-9


def generate_class_code(length: int = 7) -> str:
    """Generate a random class code of uppercase/lowercase letters and digits."""
    return "".join(random.choices(_CODE_CHARS, k=length))


class JoinRequestStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


@dataclass
class ClassJoinRequest:
    """A request from a user to join a private class."""
    class_id: UUID
    user_id: UUID
    username: str
    id: UUID = field(default_factory=uuid4)
    status: JoinRequestStatus = JoinRequestStatus.PENDING
    created_at: datetime = field(default_factory=datetime.utcnow)

    def accept(self) -> None:
        if self.status != JoinRequestStatus.PENDING:
            raise ValueError("Can only accept a pending request")
        self.status = JoinRequestStatus.ACCEPTED

    def reject(self) -> None:
        if self.status != JoinRequestStatus.PENDING:
            raise ValueError("Can only reject a pending request")
        self.status = JoinRequestStatus.REJECTED


@dataclass
class ChatMemberMention:
    user_id: UUID
    username: str
    start_index: int  # Position in message text
    end_index: int
    
    def __post_init__(self):
        if self.start_index >= self.end_index:
            raise ValueError("start_index must be less than end_index")


@dataclass
class ChatMessage:
    group_id: UUID
    sender_id: UUID
    content: str
    message_type: MessageType = MessageType.TEXT
    id: UUID = field(default_factory=uuid4)
    mentions: list[ChatMemberMention] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    edited_at: Optional[datetime] = None
    is_deleted: bool = False
    reply_to_id: Optional[UUID] = None  # For threaded replies
    metadata: dict = field(default_factory=dict)  # For file URLs, image URLs, etc.
    
    def __post_init__(self):
        if self.message_type != MessageType.SYSTEM:
            if not self.content and not self.metadata:
                raise ValueError("ChatMessage must have content or metadata")
        
        # BUSINESS RULE: Max 50 mentions per message
        if len(self.mentions) > 50:
            raise ValueError("Cannot mention more than 50 users in one message")
    
    def edit(self, new_content: str, editor_id: UUID) -> None:
        """
        Edit message content.
        
        BUSINESS RULE: Can only edit your own messages.
        """
        if self.sender_id != editor_id:
            raise PermissionError("Cannot edit another user's message")
        
        if self.is_deleted:
            raise ValueError("Cannot edit a deleted message")
        
        self.content = new_content
        self.edited_at = datetime.utcnow()
    
    def delete(self, deleter_id: UUID, is_admin: bool = False) -> None:
        """
        Soft delete a message.
        
        BUSINESS RULE: Can delete your own message or admin can delete any.
        """
        if self.sender_id != deleter_id and not is_admin:
            raise PermissionError("Cannot delete another user's message")
        
        self.is_deleted = True
        self.content = "[ChatMessage deleted]"
    
    def add_mention(self, user_id: UUID, username: str, start: int, end: int) -> None:
        """Add a mention to the message."""
        mention = ChatMemberMention(
            user_id=user_id,
            username=username,
            start_index=start,
            end_index=end,
        )
        self.mentions.append(mention)
    
    @property
    def is_edited(self) -> bool:
        """Check if message was edited."""
        return self.edited_at is not None
    
    
@dataclass
class SendChatMessageInput:
    """Input for sending a message."""
    group_id: UUID
    sender_id: UUID
    content: str
    message_type: MessageType = MessageType.TEXT
    reply_to_id: Optional[UUID] = None
    metadata: dict | None = None


@dataclass
class SendChatMessageOutput:
    """Output after sending a message."""
    message: ChatMessage
    mentioned_user_ids: list[UUID]


@dataclass
class ChatGroupMember:
    """
    Represents a user's membership in a group.
    
    BUSINESS RULES:
    - One user can only be a member once per group
    - Owner cannot be removed
    - Must have at least one owner
    """
    user_id: UUID
    username: str
    role: ChatGroupRole = ChatGroupRole.MEMBER
    joined_at: datetime = field(default_factory=datetime.utcnow)
    last_read_at: Optional[datetime] = None  # For unread count
    is_muted: bool = False  # User muted notifications
    
    def promote_to_admin(self) -> None:
        """Promote member to admin."""
        if self.role == ChatGroupRole.OWNER:
            raise ValueError("Owner cannot be promoted")
        self.role = ChatGroupRole.ADMIN
    
    def demote_to_member(self) -> None:
        """Demote admin to member."""
        if self.role == ChatGroupRole.OWNER:
            raise ValueError("Cannot demote the owner")
        self.role = ChatGroupRole.MEMBER
    
    def is_admin_or_owner(self) -> bool:
        """Check if member has admin privileges."""
        return self.role in (ChatGroupRole.ADMIN, ChatGroupRole.OWNER)


@dataclass
class ChatGroup:
    """
    Chat group entity.
    
    BUSINESS RULES:
    - Must have a name
    - Must have at least one owner
    - Max 1000 members
    - Owner cannot leave without transferring ownership
    """
    name: str
    created_by: UUID
    id: UUID = field(default_factory=uuid4)
    code: str = field(default_factory=generate_class_code)
    description: str = ""
    members: list[ChatGroupMember] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    avatar_url: Optional[str] = None
    is_private: bool = False  # Private groups require invite
    max_members: int = 1000
    
    def __post_init__(self):
        if not self.name or not self.name.strip():
            raise ValueError("ChatGroup name cannot be empty")
        
        if not self.members:
            self.members.append(
                ChatGroupMember(
                    user_id=self.created_by,
                    username="",  # Will be populated by use case
                    role=ChatGroupRole.OWNER,
                )
            )
    
    def add_member(
        self, 
        user_id: UUID, 
        username: str, 
        role: ChatGroupRole = ChatGroupRole.MEMBER
    ) -> None:
        """
        Add a new member to the group.
        
        BUSINESS RULE: Cannot exceed max members.
        """
        # Check if already a member
        if self.is_member(user_id):
            raise ValueError(f"User {username} is already a member")
        
        # Check max members
        if len(self.members) >= self.max_members:
            raise ValueError(f"ChatGroup has reached maximum of {self.max_members} members")
        
        member = ChatGroupMember(
            user_id=user_id,
            username=username,
            role=role,
        )
        self.members.append(member)
    
    def remove_member(self, user_id: UUID, remover_id: UUID) -> None:
        """
        Remove a member from the group.
        
        BUSINESS RULES:
        - Only admins/owner can remove members
        - Cannot remove the owner
        - Owner can leave only if there's another owner
        """
        member = self.get_member(user_id)
        if not member:
            raise ValueError("User is not a member of this group")
        
        remover = self.get_member(remover_id)
        if not remover:
            raise PermissionError("You are not a member of this group")
        
        # BUSINESS RULE: Only admins can remove
        if not remover.is_admin_or_owner() and remover_id != user_id:
            raise PermissionError("Only admins can remove members")
        
        # BUSINESS RULE: Cannot remove owner
        if member.role == ChatGroupRole.OWNER:
            owners_count = sum(1 for m in self.members if m.role == ChatGroupRole.OWNER)
            if owners_count == 1:
                raise ValueError("Cannot remove the last owner. Transfer ownership first.")
        
        self.members = [m for m in self.members if m.user_id != user_id]
    
    def transfer_ownership(
        self, 
        current_owner_id: UUID, 
        new_owner_id: UUID
    ) -> None:
        """Transfer ownership to another member."""
        current_owner = self.get_member(current_owner_id)
        if not current_owner or current_owner.role != ChatGroupRole.OWNER:
            raise PermissionError("Only the owner can transfer ownership")
        
        new_owner = self.get_member(new_owner_id)
        if not new_owner:
            raise ValueError("New owner must be a member of the group")
        
        # Transfer ownership
        current_owner.demote_to_member()
        new_owner.role = ChatGroupRole.OWNER
    
    def promote_member(self, user_id: UUID, promoter_id: UUID) -> None:
        """Promote a member to admin."""
        promoter = self.get_member(promoter_id)
        if not promoter or promoter.role != ChatGroupRole.OWNER:
            raise PermissionError("Only the owner can promote members")
        
        member = self.get_member(user_id)
        if not member:
            raise ValueError("User is not a member")
        
        member.promote_to_admin()
    
    def demote_member(self, user_id: UUID, demoter_id: UUID) -> None:
        """Demote an admin to member."""
        demoter = self.get_member(demoter_id)
        if not demoter or demoter.role != ChatGroupRole.OWNER:
            raise PermissionError("Only the owner can demote members")
        
        member = self.get_member(user_id)
        if not member:
            raise ValueError("User is not a member")
        
        member.demote_to_member()
    
    def update_last_read(self, user_id: UUID) -> None:
        """Update the last read timestamp for a member."""
        member = self.get_member(user_id)
        if member:
            member.last_read_at = datetime.utcnow()
    
    def is_member(self, user_id: UUID) -> bool:
        """Check if a user is a member of this group."""
        return any(m.user_id == user_id for m in self.members)
    
    def get_member(self, user_id: UUID) -> Optional[ChatGroupMember]:
        """Get a member by user ID."""
        return next((m for m in self.members if m.user_id == user_id), None)
    
    def get_member_count(self) -> int:
        """Get the number of members in the group."""
        return len(self.members)
    
    def get_admin_ids(self) -> list[UUID]:
        """Get list of all admin and owner user IDs."""
        return [
            m.user_id 
            for m in self.members 
            if m.role in (ChatGroupRole.ADMIN, ChatGroupRole.OWNER)
        ]
        
