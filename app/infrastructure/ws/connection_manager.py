import asyncio
from typing import Dict, Set
from uuid import UUID

from fastapi import WebSocket

from app.application.interfaces import IChatPubSub
from app.core.logging import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for a single FastAPI instance.
    
    ARCHITECTURE:
    ┌─────────────────────────────────────────────────────────┐
    │  Client Browser 1  │  Client Browser 2  │  Client Browser 3 │
    └───────WebSocket──────────WebSocket──────────WebSocket────┘
                           │                │                │
                           ↓                ↓                ↓
    ┌──────────────────────────────────────────────────────────┐
    │  FastAPI Instance 1 - ConnectionManager                  │
    │  - Manages WebSocket connections                         │
    │  - Subscribes to Redis channels                          │
    └──────────────────────────────────────────────────────────┘
                                    ↕
    ┌──────────────────────────────────────────────────────────┐
    │  Redis Pub/Sub (IChatPubSub)                             │
    │  - Relays messages between instances                     │
    └──────────────────────────────────────────────────────────┘
                                    ↕
    ┌──────────────────────────────────────────────────────────┐
    │  FastAPI Instance 2 - ConnectionManager                  │
    │  - Different set of WebSocket connections                │
    └──────────────────────────────────────────────────────────┘
    
    HOW IT SCALES:
    - Each FastAPI instance has its own ConnectionManager
    - ConnectionManager only knows about WebSockets connected to THIS instance
    - Redis Pub/Sub broadcasts messages to ALL instances
    - Load balancer distributes clients across instances
    
    EFFICIENCY:
    - O(1) lookup for connections by group
    - O(n) broadcast where n = connections in THIS instance only
    - No cross-instance communication needed (Redis handles it)
    """
    
    def __init__(self, pubsub: IChatPubSub):
        """
        Initialize connection manager.
        
        Args:
            pubsub: Redis pub/sub service for inter-instance communication
        """
        self._pubsub = pubsub
        
        # Map: group_id -> Set of WebSocket connections
        self._group_connections: Dict[UUID, Set[WebSocket]] = {}
        
        # Map: WebSocket -> user_id (for tracking who's who)
        self._connection_users: Dict[WebSocket, UUID] = {}
        
        # Map: group_id -> subscription_started (bool)
        # Track which groups we've subscribed to in Redis
        self._subscribed_groups: Set[UUID] = set()
    
    async def connect(self, websocket: WebSocket, user_id: UUID, group_id: UUID):
        """
        Connect a WebSocket to a group.
        
        Steps:
        1. Accept WebSocket connection
        2. Add to group connections
        3. Subscribe to Redis channel (if not already)
        4. Publish "user joined" event
        """
        # Accept WebSocket
        await websocket.accept()
        
        # Track connection
        if group_id not in self._group_connections:
            self._group_connections[group_id] = set()
        
        self._group_connections[group_id].add(websocket)
        self._connection_users[websocket] = user_id
        
        # Subscribe to Redis channel for this group (if first connection)
        if group_id not in self._subscribed_groups:
            await self._subscribe_to_group(group_id)
            self._subscribed_groups.add(group_id)
        
        logger.info(f"User {user_id} connected to group {group_id}")
        
        # Publish "user joined" event to all instances
        # This will be received by ALL instances and broadcast to their clients
        # (We'll get username from the use case layer)
    
    async def disconnect(self, websocket: WebSocket, group_id: UUID):
        """
        Disconnect a WebSocket from a group.
        
        Steps:
        1. Remove from group connections
        2. Publish "user left" event
        3. Unsubscribe from Redis if no more connections
        """
        user_id = self._connection_users.get(websocket)
        
        # Remove connection
        if group_id in self._group_connections:
            self._group_connections[group_id].discard(websocket)
            
            # Clean up empty groups
            if not self._group_connections[group_id]:
                del self._group_connections[group_id]
                
                # Unsubscribe from Redis channel
                await self._pubsub.unsubscribe_from_group(group_id)
                self._subscribed_groups.discard(group_id)
        
        if websocket in self._connection_users:
            del self._connection_users[websocket]
        
        logger.info(f"User {user_id} disconnected from group {group_id}")
    
    async def broadcast_to_group(self, group_id: UUID, message: dict):
        """
        Broadcast a message to all WebSocket connections in a group.
        
        This is called when we receive a message from Redis Pub/Sub.
        It only broadcasts to connections managed by THIS instance.
        
        Args:
            group_id: ChatGroup to broadcast to
            message: JSON-serializable message dict
        """
        if group_id not in self._group_connections:
            return
        
        # Get all connections for this group (on THIS instance)
        connections = self._group_connections[group_id].copy()
        
        # Broadcast to all connections
        # Use asyncio.gather for parallel sending
        tasks = []
        for websocket in connections:
            tasks.append(self._send_to_connection(websocket, message, group_id))
        
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _send_to_connection(
        self,
        websocket: WebSocket,
        message: dict,
        group_id: UUID,
    ):
        """
        Send a message to a single WebSocket connection.
        
        Handles disconnection gracefully.
        """
        try:
            await websocket.send_json(message)
        
        except Exception as e:
            # Connection is dead - clean it up
            logger.warning(f"Error sending to WebSocket: {e}")
            await self.disconnect(websocket, group_id)
    
    async def _subscribe_to_group(self, group_id: UUID):
        """
        Subscribe to a group's Redis channel.
        
        When messages are published to Redis, they'll be received here
        and broadcast to all WebSocket connections in THIS instance.
        """
        async def handle_redis_message(event_data: dict):
            """
            Callback invoked when a message is received from Redis.
            
            This is where messages from OTHER FastAPI instances arrive.
            We then broadcast them to our local WebSocket connections.
            """
            await self.broadcast_to_group(group_id, event_data)
        
        # Subscribe with our callback
        await self._pubsub.subscribe_to_group(group_id, handle_redis_message)
        
        logger.info(f"Subscribed to Redis channel for group {group_id}")
    
    def get_connection_count(self, group_id: UUID) -> int:
        """Get number of active connections for a group (on THIS instance)."""
        if group_id not in self._group_connections:
            return 0
        return len(self._group_connections[group_id])
    
    def get_total_connections(self) -> int:
        """Get total number of active connections (on THIS instance)."""
        return sum(len(conns) for conns in self._group_connections.values())
    
    async def shutdown(self):
        """
        Gracefully shutdown all connections.
        
        Call this on application shutdown.
        """
        # Close all WebSocket connections
        all_connections = []
        for connections in self._group_connections.values():
            all_connections.extend(connections)
        
        for websocket in all_connections:
            try:
                await websocket.close()
            except:
                pass
        
        # Unsubscribe from all Redis channels
        for group_id in list(self._subscribed_groups):
            await self._pubsub.unsubscribe_from_group(group_id)
        
        self._group_connections.clear()
        self._connection_users.clear()
        self._subscribed_groups.clear()
        
        logger.info("ConnectionManager shutdown complete")


# =============================================================================
# HELPER: Get authenticated user from WebSocket
# =============================================================================

from fastapi import WebSocket, status
from jose import JWTError, jwt


async def get_websocket_user(websocket: WebSocket, secret_key: str) -> UUID:
    """
    Authenticate WebSocket connection using JWT token.
    
    Expected: Token in query params or headers
    Example: ws://localhost:8000/ws/chat?token=eyJhbGc...
    
    Args:
        websocket: WebSocket connection
        secret_key: JWT secret key
        
    Returns:
        User ID from token
        
    Raises:
        WebSocketException: If authentication fails
    """
    # Try to get token from query params
    token = websocket.query_params.get("token")
    
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise ValueError("No authentication token provided")
    
    try:
        # Decode JWT
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        user_id = payload.get("user_id")
        
        if not user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            raise ValueError("Invalid token payload")
        
        return UUID(user_id)
    
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise ValueError("Invalid token")