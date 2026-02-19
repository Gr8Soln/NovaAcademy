from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID, uuid4
from enum import Enum
from typing import Optional


class GroupRole(Enum):
    """Role of a member in a group."""
    OWNER = "owner"      # Created the group
    ADMIN = "admin"      # Can manage members, delete messages
    MEMBER = "member"    # Regular member


@dataclass
class GroupMember:
    """
    Represents a user's membership in a group.
    
    BUSINESS RULES:
    - One user can only be a member once per group
    - Owner cannot be removed
    - Must have at least one owner
    """
    user_id: UUID
    username: str
    role: GroupRole = GroupRole.MEMBER
    joined_at: datetime = field(default_factory=datetime.utcnow)
    last_read_at: Optional[datetime] = None  # For unread count
    is_muted: bool = False  # User muted notifications
    
    def promote_to_admin(self) -> None:
        """Promote member to admin."""
        if self.role == GroupRole.OWNER:
            raise ValueError("Owner cannot be promoted")
        self.role = GroupRole.ADMIN
    
    def demote_to_member(self) -> None:
        """Demote admin to member."""
        if self.role == GroupRole.OWNER:
            raise ValueError("Cannot demote the owner")
        self.role = GroupRole.MEMBER
    
    def is_admin_or_owner(self) -> bool:
        """Check if member has admin privileges."""
        return self.role in (GroupRole.ADMIN, GroupRole.OWNER)


@dataclass
class Group:
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
    description: str = ""
    members: list[GroupMember] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    avatar_url: Optional[str] = None
    is_private: bool = False  # Private groups require invite
    max_members: int = 1000
    
    def __post_init__(self):
        # BUSINESS RULE: Name cannot be empty
        if not self.name or not self.name.strip():
            raise ValueError("Group name cannot be empty")
        
        # BUSINESS RULE: Must have an owner on creation
        if not self.members:
            # Add creator as owner
            self.members.append(
                GroupMember(
                    user_id=self.created_by,
                    username="",  # Will be populated by use case
                    role=GroupRole.OWNER,
                )
            )
    
    def add_member(
        self, 
        user_id: UUID, 
        username: str, 
        role: GroupRole = GroupRole.MEMBER
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
            raise ValueError(f"Group has reached maximum of {self.max_members} members")
        
        member = GroupMember(
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
        if member.role == GroupRole.OWNER:
            owners_count = sum(1 for m in self.members if m.role == GroupRole.OWNER)
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
        if not current_owner or current_owner.role != GroupRole.OWNER:
            raise PermissionError("Only the owner can transfer ownership")
        
        new_owner = self.get_member(new_owner_id)
        if not new_owner:
            raise ValueError("New owner must be a member of the group")
        
        # Transfer ownership
        current_owner.demote_to_member()
        new_owner.role = GroupRole.OWNER
    
    def promote_member(self, user_id: UUID, promoter_id: UUID) -> None:
        """Promote a member to admin."""
        promoter = self.get_member(promoter_id)
        if not promoter or promoter.role != GroupRole.OWNER:
            raise PermissionError("Only the owner can promote members")
        
        member = self.get_member(user_id)
        if not member:
            raise ValueError("User is not a member")
        
        member.promote_to_admin()
    
    def demote_member(self, user_id: UUID, demoter_id: UUID) -> None:
        """Demote an admin to member."""
        demoter = self.get_member(demoter_id)
        if not demoter or demoter.role != GroupRole.OWNER:
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
    
    def get_member(self, user_id: UUID) -> Optional[GroupMember]:
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
            if m.role in (GroupRole.ADMIN, GroupRole.OWNER)
        ]