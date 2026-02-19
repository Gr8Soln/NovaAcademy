from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID, uuid4
from enum import Enum
from typing import Optional


class MessageType(Enum):
    """Type of message in the chat."""
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    SYSTEM = "system"  # "User joined", "User left", etc.


@dataclass
class Mention:
    """
    Represents a user mention (@username) in a message.
    
    WHY a separate entity:
    - Mentions have their own business rules (can't mention yourself, etc.)
    - Need to track notification state
    - Need to query "all messages where I was mentioned"
    """
    user_id: UUID
    username: str
    start_index: int  # Position in message text
    end_index: int
    
    def __post_init__(self):
        if self.start_index >= self.end_index:
            raise ValueError("start_index must be less than end_index")


@dataclass
class Message:
    """
    Core message entity.
    
    BUSINESS RULES:
    - Message content cannot be empty (unless it's an image/file)
    - Can only edit your own messages
    - Can only delete your own messages (or if you're a group admin)
    - Cannot mention more than 50 people in one message
    - Edited messages show "edited" indicator
    """
    group_id: UUID
    sender_id: UUID
    content: str
    message_type: MessageType = MessageType.TEXT
    id: UUID = field(default_factory=uuid4)
    mentions: list[Mention] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    edited_at: Optional[datetime] = None
    is_deleted: bool = False
    reply_to_id: Optional[UUID] = None  # For threaded replies
    metadata: dict = field(default_factory=dict)  # For file URLs, image URLs, etc.
    
    def __post_init__(self):
        # BUSINESS RULE: Non-system messages must have content or metadata
        if self.message_type != MessageType.SYSTEM:
            if not self.content and not self.metadata:
                raise ValueError("Message must have content or metadata")
        
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
        self.content = "[Message deleted]"
    
    def add_mention(self, user_id: UUID, username: str, start: int, end: int) -> None:
        """Add a mention to the message."""
        mention = Mention(
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