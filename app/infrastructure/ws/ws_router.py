from uuid import UUID

from fastapi import APIRouter, Depends, WebSocket

from app.core.config import get_settings
from app.infrastructure.api.dependencies import (get_chat_presence_service,
                                                 get_connection_manager)
from app.infrastructure.ws.connection_manager import (ConnectionManager,
                                                      get_websocket_user)

router = APIRouter(prefix="/chat", tags=["Class chat"])

@router.websocket("/groups/{group_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    group_id: UUID,
    manager: ConnectionManager = Depends(get_connection_manager),
    presence_service = Depends(get_chat_presence_service),
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
    
    try:
        user_id = await get_websocket_user(websocket, settings.SECRET_KEY)
    except ValueError as e:
        return  
    
    # Connect WebSocket
    await manager.connect(websocket, user_id, group_id)
    
    # Mark user as online
    await presence_service.set_user_online(user_id, group_id)
    
    try:
        # Listen for messages from client
        while True:
            data = await websocket.receive_json()
            
            # Handle different message types from client
            msg_type = data.get("type")
            
            if msg_type == "typing":
                # Broadcast typing indicator
                # (In production, use use case + pub/sub)
                pass
            
            elif msg_type == "heartbeat":
                # Refresh presence
                await presence_service.set_user_online(user_id, group_id)
            
            # Note: Actual message sending should use REST API,
            # not WebSocket, for better error handling and persistence
    
    except Exception as e:
        print(f"WebSocket error: {e}")
    
    finally:
        # Disconnect
        await manager.disconnect(websocket, group_id)
        await presence_service.set_user_offline(user_id, group_id)