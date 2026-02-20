import re
from typing import Optional
from uuid import UUID

from app.application.interfaces import (IChatCacheInterface,
                                        IChatGroupInterface,
                                        IChatMessageInterface,
                                        IChatNotificationInterface,
                                        IChatPubSub)
from app.domain.entities import (ChatGroup, ChatMessage, SendChatMessageInput,
                                 SendChatMessageOutput)


class SendChatMessageUseCase:
    MENTION_PATTERN = re.compile(r'@([\w-]+)')
    
    def __init__(
        self,
        message_repo: IChatMessageInterface,
        group_repo: IChatGroupInterface,
        pubsub: IChatPubSub,
        cache: IChatCacheInterface,
        notification_service: IChatNotificationInterface,
    ):
        self._message_repo = message_repo
        self._group_repo = group_repo
        self._pubsub = pubsub
        self._cache = cache
        self._notification = notification_service
    
    async def execute(self, input_data: SendChatMessageInput) -> SendChatMessageOutput:
        """
        Execute the send message use case.
        
        Flow:
        1. Load group (with caching)
        2. Verify sender is member
        3. Parse mentions
        4. Create message entity
        5. Persist to database
        6. Broadcast via pub/sub (for real-time delivery)
        7. Send notifications
        """
        group = await self._get_group(input_data.group_id)
        if not group:
            raise ValueError(f"ChatGroup not found")
        
        if not group.is_member(input_data.sender_id):
            raise PermissionError("You are not a member of this group")
        
        mentioned_users = await self._parse_mentions(
            content=input_data.content,
            group=group,
            sender_id=input_data.sender_id,
        )
        
        message = ChatMessage(
            group_id=input_data.group_id,
            sender_id=input_data.sender_id,
            content=input_data.content,
            message_type=input_data.message_type,
            reply_to_id=input_data.reply_to_id,
            metadata=input_data.metadata or {},
        )
        
        # Add mentions to message
        for user_id, username, start, end in mentioned_users:
            message.add_mention(user_id, username, start, end)
        
        # 5. Persist message
        saved_message = await self._message_repo.save(message)
        
        # 6. Cache the message (short TTL for recent messages)
        await self._cache.set_message(saved_message, ttl=300)  # 5 minutes
        
        # 7. Broadcast message in real-time via pub/sub
        # This will reach ALL FastAPI instances, which will then
        # broadcast to their connected WebSocket clients
        await self._pubsub.publish_message(input_data.group_id, saved_message)
        
        # 8. Send notifications to mentioned users (async/background)
        if message.mentions:
            await self._notify_mentioned_users(
                message=saved_message,
                group_name=group.name,
            )
        
        # Return result
        mentioned_user_ids = [m.user_id for m in message.mentions]
        return SendChatMessageOutput(
            message=saved_message,
            mentioned_user_ids=mentioned_user_ids,
        )
    
    async def _get_group(self, group_id: UUID) -> Optional[ChatGroup]:
        """Get group from cache or database."""
        group = await self._cache.get_group(group_id)
        if group:
            return group
        
        group = await self._group_repo.get_by_id(group_id)
        if group:
            await self._cache.set_group(group, ttl=3600) 
        
        return group
    
    async def _parse_mentions(
        self,
        content: str,
        group: ChatGroup,
        sender_id: UUID,
    ) -> list[tuple[UUID, str, int, int]]:
        """
        Parse @mentions from message content.
        
        Returns:
            List of (user_id, username, start_index, end_index)
        
        BUSINESS RULES:
        - Can only mention group members
        - Cannot mention yourself
        - Duplicate mentions are deduplicated
        """
        if not content:
            return []
        
        mentions = []
        seen_users = set()  # For deduplication
        
        # Find all @username patterns
        for match in self.MENTION_PATTERN.finditer(content):
            username = match.group(1)  # Extract username without @
            start_index = match.start()
            end_index = match.end()
            
            # Find the user in the group
            member = next(
                (m for m in group.members if m.username.lower() == username.lower()),
                None
            )
            
            if member:
                # BUSINESS RULE: Cannot mention yourself
                if member.user_id == sender_id:
                    continue
                
                # Deduplicate
                if member.user_id in seen_users:
                    continue
                
                seen_users.add(member.user_id)
                mentions.append((
                    member.user_id,
                    member.username,
                    start_index,
                    end_index,
                ))
        
        return mentions
    
    async def _notify_mentioned_users(self, message: ChatMessage, group_name: str) -> None:
        """Send notifications to users who were mentioned."""
        for mention in message.mentions:
            try:
                await self._notification.notify_mention(
                    mentioned_user_id=mention.user_id,
                    message=message,
                    group_name=group_name,
                )
            except Exception as e:
                # Log error but don't fail the message send
                # Notifications are non-critical
                print(f"Failed to send mention notification: {e}")


# =============================================================================
# OTHER USE CASES
# =============================================================================

from datetime import datetime


class GetChatMessagesUseCase:
    """Get messages for a group with pagination."""
    
    def __init__(
        self,
        message_repo: IChatMessageInterface,
        group_repo: IChatGroupInterface,
    ):
        self._message_repo = message_repo
        self._group_repo = group_repo
    
    async def execute(
        self,
        group_id: UUID,
        user_id: UUID,
        limit: int = 50,
        before: Optional[datetime] = None,
    ) -> list[ChatMessage]:
        """
        Get messages with pagination.
        
        BUSINESS RULE: User must be a member of the group.
        """
        # Verify membership
        is_member = await self._group_repo.is_member(group_id, user_id)
        if not is_member:
            raise PermissionError("You are not a member of this group")
        
        # Get messages
        messages = await self._message_repo.get_group_messages(
            group_id=group_id,
            limit=limit,
            before=before,
        )
        
        return messages


class EditChatMessageUseCase:
    """Edit a message."""
    
    def __init__(
        self,
        message_repo: IChatMessageInterface,
        cache: IChatCacheInterface,
        pubsub: IChatPubSub,
    ):
        self._message_repo = message_repo
        self._cache = cache
        self._pubsub = pubsub
    
    async def execute(
        self,
        message_id: UUID,
        editor_id: UUID,
        new_content: str,
    ) -> ChatMessage:
        """
        Edit a message.
        
        BUSINESS RULE: Can only edit your own messages.
        """
        # Load message
        message = await self._message_repo.get_by_id(message_id)
        if not message:
            raise ValueError("ChatMessage not found")
        
        # Edit (entity enforces business rules)
        message.edit(new_content, editor_id)
        
        # Parse new mentions (similar to SendChatMessageUseCase)
        # ... (omitted for brevity, but should extract mentions from new_content)
        
        # Persist
        updated_message = await self._message_repo.save(message)
        
        # Update cache
        await self._cache.set_message(updated_message, ttl=300)
        
        # Broadcast update
        await self._pubsub.publish_message(message.group_id, updated_message)
        
        return updated_message


class DeleteChatMessageUseCase:
    """Delete a message."""
    
    def __init__(
        self,
        message_repo: IChatMessageInterface,
        group_repo: IChatGroupInterface,
        cache: IChatCacheInterface,
        pubsub: IChatPubSub,
    ):
        self._message_repo = message_repo
        self._group_repo = group_repo
        self._cache = cache
        self._pubsub = pubsub
    
    async def execute(self, message_id: UUID, deleter_id: UUID) -> None:
        """
        Delete a message.
        
        BUSINESS RULE: Can delete your own or if you're admin.
        """
        # Load message
        message = await self._message_repo.get_by_id(message_id)
        if not message:
            raise ValueError("ChatMessage not found")
        
        # Check if user is admin
        group = await self._group_repo.get_by_id(message.group_id)
        member = group.get_member(deleter_id) if group else None
        is_admin = member.is_admin_or_owner() if member else False
        
        # Delete (entity enforces rules)
        message.delete(deleter_id, is_admin)
        
        # Persist
        await self._message_repo.save(message)
        
        # Broadcast deletion
        await self._pubsub.publish_message(message.group_id, message)


class SearchchatMessagesUseCase:
    """Search messages in a group."""
    
    def __init__(
        self,
        message_repo: IChatMessageInterface,
        group_repo: IChatGroupInterface,
    ):
        self._message_repo = message_repo
        self._group_repo = group_repo
    
    async def execute(
        self,
        group_id: UUID,
        user_id: UUID,
        query: str,
        limit: int = 20,
    ) -> list[ChatMessage]:
        """Search messages."""
        # Verify membership
        is_member = await self._group_repo.is_member(group_id, user_id)
        if not is_member:
            raise PermissionError("You are not a member of this group")
        
        return await self._message_repo.search_messages(
            group_id=group_id,
            query=query,
            limit=limit,
        )


# =============================================================================
# GROUP MANAGEMENT USE CASES  (renamed: Group → Class)
# =============================================================================

from app.application.interfaces import IUserInterface
from app.domain.entities import ClassJoinRequest, User, generate_class_code


class CreateClassUseCase:
    """Create a new class and optionally add initial members."""

    def __init__(
        self,
        group_repo: IChatGroupInterface,
        user_repo: IUserInterface,
        storage: "IStorageService | None" = None,
    ):
        self._group_repo = group_repo
        self._user_repo = user_repo
        self._storage = storage

    async def execute(
        self,
        creator_id: UUID,
        name: str,
        description: str = "",
        avatar_file=None,
        is_private: bool = False,
        initial_member_usernames: list[str] | None = None,
    ) -> ChatGroup:
        creator = await self._user_repo.get_by_id(creator_id)
        if not creator:
            raise ValueError("Creator not found")

        # Ensure unique code
        code = generate_class_code()
        while await self._group_repo.get_by_code(code):
            code = generate_class_code()

        avatar_url: str | None = None
        if avatar_file and self._storage:
            result = await self._storage.upload_image(avatar_file)
            avatar_url = result["file_url"]

        group = ChatGroup(
            name=name,
            code=code,
            description=description,
            created_by=creator_id,
            avatar_url=avatar_url,
            is_private=is_private,
        )
        # Fix auto-created stub member – replace with real username
        group.members[0].username = creator.username or creator.email.split("@")[0]

        for username in (initial_member_usernames or []):
            user = await self._user_repo.get_by_username(username)
            if user and not group.is_member(user.id):
                uname = user.username or user.email.split("@")[0]
                group.add_member(user.id, uname)

        return await self._group_repo.save(group)


class GetUserClassesUseCase:
    """Return all classes the caller belongs to."""

    def __init__(self, group_repo: IChatGroupInterface):
        self._group_repo = group_repo

    async def execute(self, user_id: UUID) -> list[ChatGroup]:
        return await self._group_repo.get_user_groups(user_id)


class GetClassUseCase:
    """Return a single class by code (caller must be a member)."""

    def __init__(self, group_repo: IChatGroupInterface):
        self._group_repo = group_repo

    async def execute(self, class_code: str, user_id: UUID) -> ChatGroup:
        group = await self._group_repo.get_by_code(class_code)
        if not group:
            raise ValueError("Class not found")
        if not group.is_member(user_id):
            raise PermissionError("You are not a member of this class")
        return group


class UpdateClassUseCase:
    """Update class metadata – owner or admin only."""

    def __init__(
        self,
        group_repo: IChatGroupInterface,
        storage: "IStorageService | None" = None,
    ):
        self._group_repo = group_repo
        self._storage = storage

    async def execute(
        self,
        class_code: str,
        editor_id: UUID,
        name: Optional[str] = None,
        description: Optional[str] = None,
        avatar_file=None,
        is_private: Optional[bool] = None,
    ) -> ChatGroup:
        group = await self._group_repo.get_by_code(class_code)
        if not group:
            raise ValueError("Class not found")

        member = group.get_member(editor_id)
        if not member or not member.is_admin_or_owner():
            raise PermissionError("Only admins or the owner can update the class")

        if name is not None:
            group.name = name.strip()
        if description is not None:
            group.description = description
        if avatar_file and self._storage:
            result = await self._storage.upload_image(avatar_file)
            group.avatar_url = result["file_url"]
        if is_private is not None:
            group.is_private = is_private

        return await self._group_repo.save(group)


class AddClassMemberUseCase:
    """Add a user to a class by username – owner or admin only."""

    def __init__(self, group_repo: IChatGroupInterface, user_repo: IUserInterface):
        self._group_repo = group_repo
        self._user_repo = user_repo

    async def execute(self, class_code: str, adder_id: UUID, username: str) -> ChatGroup:
        group = await self._group_repo.get_by_code(class_code)
        if not group:
            raise ValueError("Class not found")

        adder = group.get_member(adder_id)
        if not adder or not adder.is_admin_or_owner():
            raise PermissionError("Only admins or the owner can add members")

        user = await self._user_repo.get_by_username(username)
        if not user:
            raise ValueError(f"User '{username}' not found")

        uname = user.username or user.email.split("@")[0]
        group.add_member(user.id, uname)
        return await self._group_repo.save(group)


class RemoveClassMemberUseCase:
    """Remove a member from a class – owner or admin only (or self-leave)."""

    def __init__(self, group_repo: IChatGroupInterface):
        self._group_repo = group_repo

    async def execute(self, class_code: str, remover_id: UUID, target_user_id: UUID) -> ChatGroup:
        group = await self._group_repo.get_by_code(class_code)
        if not group:
            raise ValueError("Class not found")

        group.remove_member(target_user_id, remover_id)
        return await self._group_repo.save(group)


class ChangeClassMemberRoleUseCase:
    """Promote or demote a member – owner only."""

    def __init__(self, group_repo: IChatGroupInterface):
        self._group_repo = group_repo

    async def execute(
        self, class_code: str, owner_id: UUID, target_user_id: UUID, new_role: str
    ) -> ChatGroup:
        group = await self._group_repo.get_by_code(class_code)
        if not group:
            raise ValueError("Class not found")

        if new_role == "admin":
            group.promote_member(target_user_id, owner_id)
        elif new_role == "member":
            group.demote_member(target_user_id, owner_id)
        else:
            raise ValueError("Role must be 'admin' or 'member'")

        return await self._group_repo.save(group)


class DeleteClassUseCase:
    """Delete a class – owner only."""

    def __init__(self, group_repo: IChatGroupInterface):
        self._group_repo = group_repo

    async def execute(self, class_code: str, user_id: UUID) -> None:
        group = await self._group_repo.get_by_code(class_code)
        if not group:
            raise ValueError("Class not found")

        member = group.get_member(user_id)
        if not member or member.role.value != "owner":
            raise PermissionError("Only the owner can delete the class")

        await self._group_repo.delete(group.id)


# =============================================================================
# SEARCH & JOIN USE CASES
# =============================================================================


class SearchClassesUseCase:
    """Search public (non-private) classes by name/description."""

    def __init__(self, group_repo: IChatGroupInterface):
        self._group_repo = group_repo

    async def execute(self, query: str, limit: int = 20) -> list[ChatGroup]:
        return await self._group_repo.search_public(query=query, limit=limit)


class JoinClassUseCase:
    """
    Join a class by code.
    - Public class → added immediately
    - Private class → creates a pending join request
    """

    def __init__(self, group_repo: IChatGroupInterface, user_repo: IUserInterface):
        self._group_repo = group_repo
        self._user_repo = user_repo

    async def execute(
        self, class_code: str, user_id: UUID
    ) -> dict:
        """Returns {'joined': True/False, 'join_request': JoinRequest | None}"""
        group = await self._group_repo.get_by_code(class_code)
        if not group:
            raise ValueError("Class not found")

        if group.is_member(user_id):
            raise ValueError("You are already a member of this class")

        user = await self._user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        username = user.username or user.email.split("@")[0]

        if not group.is_private:
            # Public class → join immediately
            group.add_member(user_id, username)
            await self._group_repo.save(group)
            return {"joined": True, "join_request": None}
        else:
            # Private class → create join request
            if await self._group_repo.has_pending_request(group.id, user_id):
                raise ValueError("You already have a pending join request")

            join_request = ClassJoinRequest(
                class_id=group.id,
                user_id=user_id,
                username=username,
            )
            saved = await self._group_repo.save_join_request(join_request)
            return {"joined": False, "join_request": saved}


class GetJoinRequestsUseCase:
    """Get all pending join requests for a class – admin/owner only."""

    def __init__(self, group_repo: IChatGroupInterface):
        self._group_repo = group_repo

    async def execute(self, class_code: str, user_id: UUID) -> list[ClassJoinRequest]:
        group = await self._group_repo.get_by_code(class_code)
        if not group:
            raise ValueError("Class not found")

        member = group.get_member(user_id)
        if not member or not member.is_admin_or_owner():
            raise PermissionError("Only admins or the owner can view join requests")

        return await self._group_repo.get_join_requests(group.id)


class HandleJoinRequestUseCase:
    """Accept or reject a join request – admin/owner only."""

    def __init__(self, group_repo: IChatGroupInterface):
        self._group_repo = group_repo

    async def execute(
        self,
        class_code: str,
        request_id: UUID,
        handler_id: UUID,
        action: str,  # "accept" or "reject"
    ) -> ClassJoinRequest:
        group = await self._group_repo.get_by_code(class_code)
        if not group:
            raise ValueError("Class not found")

        member = group.get_member(handler_id)
        if not member or not member.is_admin_or_owner():
            raise PermissionError("Only admins or the owner can handle join requests")

        join_request = await self._group_repo.get_join_request_by_id(request_id)
        if not join_request:
            raise ValueError("Join request not found")

        if join_request.class_id != group.id:
            raise ValueError("Join request does not belong to this class")

        if action == "accept":
            join_request.accept()
            # Add user to the group
            group.add_member(join_request.user_id, join_request.username)
            await self._group_repo.save(group)
        elif action == "reject":
            join_request.reject()
        else:
            raise ValueError("Action must be 'accept' or 'reject'")

        return await self._group_repo.save_join_request(join_request)