from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket
from fastapi.responses import JSONResponse

from app.adapters.schemas import (EditMessageRequest, MessageResponse,
                                  SendMessageRequest)
from app.application.dtos.enum_dto import MessageType
from app.application.use_cases import (DeleteChatMessageUseCase,
                                       EditChatMessageUseCase,
                                       GetChatMessagesUseCase,
                                       SearchchatMessagesUseCase,
                                       SendChatMessageInput,
                                       SendChatMessageUseCase)
from app.core.config import get_settings
from app.infrastructure.api.dependencies import (
    get_chat_messages_use_case, get_chat_presence_service,
    get_chat_send_message_use_case, get_connection_manager,
    get_current_user_id, get_delete_chat_message_use_case,
    get_edit_chat_message_use_case, get_search_chat_messages_use_case)
from app.infrastructure.ws.connection_manager import (ConnectionManager,
                                                      get_websocket_user)

router = APIRouter(prefix="/chat", tags=["Class chat"])

@router.post("/messages", response_model=MessageResponse, status_code=201)
async def send_message(
    request: SendMessageRequest,
    user_id: UUID = Depends(get_current_user_id),
    use_case: SendChatMessageUseCase = Depends(get_chat_send_message_use_case),
):
    """
    Send a message to a group.
    
    This is a REST endpoint for sending messages.
    For real-time delivery, messages are also broadcast via WebSocket.
    
    Flow:
    1. Validate request
    2. Execute use case
    3. Use case publishes to Redis Pub/Sub
    4. All WebSocket connections receive the message in real-time
    5. Return message in response
    """
    try:
        # Map message type
        msg_type = MessageType.TEXT
        if request.message_type == "image":
            msg_type = MessageType.IMAGE
        elif request.message_type == "file":
            msg_type = MessageType.FILE
        
        # Execute use case
        result = await use_case.execute(
            SendChatMessageInput(
                group_id=request.group_id,
                sender_id=user_id,
                content=request.content,
                message_type=msg_type,
                reply_to_id=request.reply_to_id,
            )
        )
        
        # Map to response
        message = result.message
        return MessageResponse(
            id=message.id,
            group_id=message.group_id,
            sender_id=message.sender_id,
            content=message.content,
            message_type=message.message_type.value,
            mentions=[
                {
                    "user_id": str(m.user_id),
                    "username": m.username,
                    "start_index": m.start_index,
                    "end_index": m.end_index,
                }
                for m in message.mentions
            ],
            created_at=message.created_at,
            edited_at=message.edited_at,
            is_deleted=message.is_deleted,
            reply_to_id=message.reply_to_id,
        )
    
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/groups/{group_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    group_id: UUID,
    limit: int = Query(50, le=100),
    before: Optional[datetime] = None,
    user_id: UUID = Depends(get_current_user_id),
    use_case: GetChatMessagesUseCase = Depends(get_chat_messages_use_case),
):
    """
    Get messages for a group with pagination.
    
    Pagination:
    - First request: GET /groups/{id}/messages?limit=50
    - Next page: GET /groups/{id}/messages?limit=50&before=2024-01-01T12:00:00Z
    """
    try:
        messages = await use_case.execute(
            group_id=group_id,
            user_id=user_id,
            limit=limit,
            before=before,
        )
        
        return [
            MessageResponse(
                id=msg.id,
                group_id=msg.group_id,
                sender_id=msg.sender_id,
                content=msg.content,
                message_type=msg.message_type.value,
                mentions=[
                    {
                        "user_id": str(m.user_id),
                        "username": m.username,
                        "start_index": m.start_index,
                        "end_index": m.end_index,
                    }
                    for m in msg.mentions
                ],
                created_at=msg.created_at,
                edited_at=msg.edited_at,
                is_deleted=msg.is_deleted,
                reply_to_id=msg.reply_to_id,
            )
            for msg in messages
        ]
    
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.put("/messages/{message_id}", response_model=MessageResponse)
async def edit_message(
    message_id: UUID,
    request: EditMessageRequest,
    user_id: UUID = Depends(get_current_user_id),
    use_case: EditChatMessageUseCase = Depends(get_edit_chat_message_use_case),
):
    """Edit a message."""
    try:
        message = await use_case.execute(
            message_id=message_id,
            editor_id=user_id,
            new_content=request.content,
        )
        
        return MessageResponse(
            id=message.id,
            group_id=message.group_id,
            sender_id=message.sender_id,
            content=message.content,
            message_type=message.message_type.value,
            mentions=[],  # Re-parse if needed
            created_at=message.created_at,
            edited_at=message.edited_at,
            is_deleted=message.is_deleted,
            reply_to_id=message.reply_to_id,
        )
    
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/messages/{message_id}", status_code=204)
async def delete_message(
    message_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    use_case: DeleteChatMessageUseCase = Depends(get_delete_chat_message_use_case),
):
    """Delete a message."""
    try:
        await use_case.execute(message_id, user_id)
        return JSONResponse(status_code=204, content={})
    
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/groups/{group_id}/search", response_model=list[MessageResponse])
async def search_messages(
    group_id: UUID,
    q: str = Query(..., min_length=2),
    limit: int = Query(20, le=50),
    user_id: UUID = Depends(get_current_user_id),
    use_case: SearchchatMessagesUseCase = Depends(get_search_chat_messages_use_case),
):
    """Search messages in a group."""
    try:
        messages = await use_case.execute(
            group_id=group_id,
            user_id=user_id,
            query=q,
            limit=limit,
        )
        
        return [
            MessageResponse(
                id=msg.id,
                group_id=msg.group_id,
                sender_id=msg.sender_id,
                content=msg.content,
                message_type=msg.message_type.value,
                mentions=[],
                created_at=msg.created_at,
                edited_at=msg.edited_at,
                is_deleted=msg.is_deleted,
                reply_to_id=msg.reply_to_id,
            )
            for msg in messages
        ]
    
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

