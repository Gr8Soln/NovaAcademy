from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import and_, delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.application.dtos import MessageType
from app.application.interfaces import (IChatGroupInterface,
                                        IChatMessageInterface)
from app.domain.entities import (ChatGroup, ChatGroupMember, ChatGroupRole,
                                 ChatMemberMention, ChatMessage)
from app.infrastructure.db import (GroupMemberModel, GroupModel,
                                   MessageMentionModel, MessageModel)


class SQLChatMessageRepository(IChatMessageInterface):
    def __init__(self, session: AsyncSession):
        self._session = session
    
    async def save(self, message: ChatMessage) -> ChatMessage:
        """Save a message."""
        # Check if exists (for updates)
        result = await self._session.execute(
            select(MessageModel).where(MessageModel.id == message.id)
        )
        model = result.scalar_one_or_none()
        
        if model:
            # Update existing
            model.content = message.content
            model.edited_at = message.edited_at
            model.is_deleted = message.is_deleted
            
            # Update mentions
            # Delete old mentions
            await self._session.execute(
                delete(MessageMentionModel).where(
                    MessageMentionModel.message_id == message.id
                )
            )
        else:
            # Create new
            model = MessageModel(
                id=message.id,
                group_id=message.group_id,
                sender_id=message.sender_id,
                content=message.content,
                message_type=message.message_type.value,
                created_at=message.created_at,
                edited_at=message.edited_at,
                is_deleted=message.is_deleted,
                reply_to_id=message.reply_to_id,
                metadata=message.metadata,
            )
            self._session.add(model)
        
        # Add mentions
        for mention in message.mentions:
            mention_model = MessageMentionModel(
                message_id=message.id,
                user_id=mention.user_id,
                username=mention.username,
                start_index=mention.start_index,
                end_index=mention.end_index,
            )
            self._session.add(mention_model)
        
        await self._session.flush()
        return message
    
    async def get_by_id(self, message_id: UUID) -> Optional[ChatMessage]:
        """Get a message by ID."""
        result = await self._session.execute(
            select(MessageModel)
            .options(selectinload(MessageModel.mentions))
            .where(MessageModel.id == message_id)
        )
        model = result.scalar_one_or_none()
        
        if not model:
            return None
        
        return self._to_entity(model)
    
    async def get_group_messages(
        self,
        group_id: UUID,
        limit: int = 50,
        before: Optional[datetime] = None,
    ) -> list[ChatMessage]:
        """Get messages for a group (paginated)."""
        query = (
            select(MessageModel)
            .options(selectinload(MessageModel.mentions))
            .where(MessageModel.group_id == group_id)
            .order_by(MessageModel.created_at.desc())
            .limit(limit)
        )
        
        if before:
            query = query.where(MessageModel.created_at < before)
        
        result = await self._session.execute(query)
        models = result.scalars().all()
        
        return [self._to_entity(m) for m in models]
    
    async def get_messages_by_ids(self, message_ids: list[UUID]) -> list[ChatMessage]:
        """Get multiple messages by their IDs."""
        result = await self._session.execute(
            select(MessageModel)
            .options(selectinload(MessageModel.mentions))
            .where(MessageModel.id.in_(message_ids))
        )
        models = result.scalars().all()
        
        return [self._to_entity(m) for m in models]
    
    async def search_messages(
        self,
        group_id: UUID,
        query: str,
        limit: int = 20,
    ) -> list[ChatMessage]:
        """Search messages by content."""
        # Full-text search using PostgreSQL
        result = await self._session.execute(
            select(MessageModel)
            .options(selectinload(MessageModel.mentions))
            .where(
                and_(
                    MessageModel.group_id == group_id,
                    MessageModel.content.ilike(f"%{query}%")
                )
            )
            .order_by(MessageModel.created_at.desc())
            .limit(limit)
        )
        models = result.scalars().all()
        
        return [self._to_entity(m) for m in models]
    
    async def get_messages_with_mentions(
        self,
        user_id: UUID,
        limit: int = 50,
    ) -> list[ChatMessage]:
        """Get all messages where a user was mentioned."""
        result = await self._session.execute(
            select(MessageModel)
            .options(selectinload(MessageModel.mentions))
            .join(MessageMentionModel)
            .where(MessageMentionModel.user_id == user_id)
            .order_by(MessageModel.created_at.desc())
            .limit(limit)
        )
        models = result.scalars().all()
        
        return [self._to_entity(m) for m in models]
    
    async def delete(self, message_id: UUID) -> bool:
        """Delete a message."""
        result = await self._session.execute(
            select(MessageModel).where(MessageModel.id == message_id)
        )
        model = result.scalar_one_or_none()
        
        if model:
            await self._session.delete(model)
            await self._session.flush()
            return True
        
        return False
    
    def _to_entity(self, model: MessageModel) -> ChatMessage:
        """Convert ORM model to domain entity."""
        mentions = [
            ChatMemberMention(
                user_id=m.user_id,
                username=m.username,
                start_index=m.start_index,
                end_index=m.end_index,
            )
            for m in model.mentions
        ]
        
        return ChatMessage(
            id=model.id,
            group_id=model.group_id,
            sender_id=model.sender_id,
            content=model.content,
            message_type=MessageType(model.message_type),
            created_at=model.created_at,
            edited_at=model.edited_at,
            is_deleted=model.is_deleted,
            reply_to_id=model.reply_to_id,
            metadata=model.metadata_ or {},
            mentions=mentions,
        )



class SQLChatGroupRepository(IChatGroupInterface):
    """PostgreSQL implementation of group repository."""
    
    def __init__(self, session: AsyncSession):
        self._session = session
    
    async def save(self, group: ChatGroup) -> ChatGroup:
        """Save or update a group."""
        result = await self._session.execute(
            select(GroupModel).where(GroupModel.id == group.id)
        )
        model = result.scalar_one_or_none()
        
        if model:
            # Update existing
            model.name = group.name
            model.description = group.description
            model.avatar_url = group.avatar_url
            model.is_private = group.is_private
            model.max_members = group.max_members
            
            # Update members (simple approach: delete and re-add)
            await self._session.execute(
                delete(GroupMemberModel).where(
                    GroupMemberModel.group_id == group.id
                )
            )
        else:
            # Create new
            model = GroupModel(
                id=group.id,
                name=group.name,
                description=group.description,
                created_by=group.created_by,
                created_at=group.created_at,
                avatar_url=group.avatar_url,
                is_private=group.is_private,
                max_members=group.max_members,
            )
            self._session.add(model)
        
        # Add members
        for member in group.members:
            member_model = GroupMemberModel(
                group_id=group.id,
                user_id=member.user_id,
                username=member.username,
                role=member.role.value,
                joined_at=member.joined_at,
                last_read_at=member.last_read_at,
                is_muted=member.is_muted,
            )
            self._session.add(member_model)
        
        await self._session.flush()
        return group
    
    async def get_by_id(self, group_id: UUID) -> Optional[ChatGroup]:
        """Get a group by ID."""
        result = await self._session.execute(
            select(GroupModel)
            .options(selectinload(GroupModel.members))
            .where(GroupModel.id == group_id)
        )
        model = result.scalar_one_or_none()
        
        if not model:
            return None
        
        return self._to_entity(model)
    
    async def get_user_groups(self, user_id: UUID) -> list[ChatGroup]:
        """Get all groups a user is a member of."""
        result = await self._session.execute(
            select(GroupModel)
            .options(selectinload(GroupModel.members))
            .join(GroupMemberModel)
            .where(GroupMemberModel.user_id == user_id)
            .order_by(GroupModel.created_at.desc())
        )
        models = result.scalars().all()
        
        return [self._to_entity(m) for m in models]
    
    async def delete(self, group_id: UUID) -> bool:
        """Delete a group."""
        result = await self._session.execute(
            select(GroupModel).where(GroupModel.id == group_id)
        )
        model = result.scalar_one_or_none()
        
        if model:
            await self._session.delete(model)
            await self._session.flush()
            return True
        
        return False
    
    async def is_member(self, group_id: UUID, user_id: UUID) -> bool:
        """Check if a user is a member of a group."""
        result = await self._session.execute(
            select(GroupMemberModel).where(
                and_(
                    GroupMemberModel.group_id == group_id,
                    GroupMemberModel.user_id == user_id,
                )
            )
        )
        return result.scalar_one_or_none() is not None
    
    def _to_entity(self, model: GroupModel) -> ChatGroup:
        """Convert ORM model to domain entity."""
        members = [
            ChatGroupMember(
                user_id=m.user_id,
                username=m.username,
                role=ChatGroupRole(m.role),
                joined_at=m.joined_at,
                last_read_at=m.last_read_at,
                is_muted=m.is_muted,
            )
            for m in model.members
        ]
        
        return ChatGroup(
            id=model.id,
            name=model.name,
            description=model.description or "",
            created_by=model.created_by,
            created_at=model.created_at,
            avatar_url=model.avatar_url,
            is_private=model.is_private,
            max_members=model.max_members,
            members=members,
        )