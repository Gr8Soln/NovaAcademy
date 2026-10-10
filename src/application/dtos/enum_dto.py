from enum import Enum


class AuthProvider(str, Enum):
    EMAIL = "email"
    GOOGLE = "google"
    
class ChatGroupRole(Enum):
    """Role of a member in a group."""
    OWNER = "owner"      # Created the group
    ADMIN = "admin"      # Can manage members, delete messages
    MEMBER = "member"    # Regular member
    
class MessageType(Enum):
    """Type of message in the chat."""
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    SYSTEM = "system"  # "User joined", "User left", etc.


class DocumentFileType(str, Enum):
    """Supported document file types."""
    PDF = "pdf"
    TXT = "txt"
    DOCX = "docx"
    MD = "md"

