import json
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.application.interfaces import IChatPresenceService, IChatPubSub
from app.core.config import Settings, get_settings
from app.core.logging import get_logger
from app.domain.entities import User as UserEntity
from app.infrastructure.api.dependencies import (get_chat_presence_service,
                                                 get_chat_pubsub_service,
                                                 get_connection_manager)
from app.infrastructure.db import get_db_session as db_session
from app.infrastructure.ws.connection_manager import (ConnectionManager,
                                                      get_websocket_user)

router = APIRouter(prefix="/chat", tags=["Class chat"])
logger = get_logger(__name__)

@router.websocket("/groups/{group_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    group_id: UUID,
    manager: ConnectionManager = Depends(get_connection_manager),
    presence_service: IChatPresenceService = Depends(get_chat_presence_service),
    pubsub: IChatPubSub = Depends(get_chat_pubsub_service),
):
    """
    WebSocket endpoint for real-time chat.
    
    CLIENT FLOW:
    1. Connect: ws://localhost:8000/chat/groups/{group_id}?token={jwt}
    2. Receive messages in real-time
    3. Send typing indicators, heartbeats
    4. Disconnect when done
    
    MESSAGE TYPES RECEIVED:
    - "message": New chat message
    - "typing": Someone is typing
    - "user_joined": User joined the group
    - "user_left": User left the group
    
    CLIENT CAN SEND:
    - {"type": "typing", "is_typing": true/false}
    - {"type": "heartbeat"}  ← Keep-alive for presence
    """
    settings = get_settings()
    
    # 1. Authenticate (from token in query params)
    try:
        user_id = await get_websocket_user(websocket, settings.SECRET_KEY)
    except Exception as e:
        logger.warning(f"WebSocket auth failed: {e}")
        return

    # 2. Get username for broadcast
    try:
        # We need a repository to get the user
        async with db_session() as session:
            stmt = select(UserEntity).where(UserEntity.id == user_id)
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()
            username = user.username if user else "Someone"
    except Exception as e:
        logger.warning(f"Failed to get username: {e}")
        username = "Someone"

    # Connect WebSocket
    await manager.connect(websocket, user_id, group_id, username)
    await presence_service.set_user_online(user_id, group_id)

    try:
        while True:
            # Receive message from WebSocket
            data = await websocket.receive_text()
            event = json.loads(data)
            
            if event["type"] == "typing":
                await pubsub.publish_typing_indicator(
                    group_id=group_id,
                    user_id=user_id,
                    username=username,
                    is_typing=event["is_typing"]
                )
            
            elif event["type"] == "heartbeat":
                # Refresh presence in Redis
                await presence_service.set_user_online(user_id, group_id)

    except WebSocketDisconnect:
        await manager.disconnect(websocket, group_id, username)
        await presence_service.set_user_offline(user_id, group_id)
    
    except Exception as e:
        logger.error(f"WebSocket error in group {group_id}: {e}")
        await manager.disconnect(websocket, group_id, username)
        await presence_service.set_user_offline(user_id, group_id)