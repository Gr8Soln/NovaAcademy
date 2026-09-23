```markdown
# NovaAcademy WebSocket Agent

## Overview

The WebSocket agent enables real-time communication between clients and the NovaAcademy backend. It supports features like real-time class collaboration, live chat, and presence tracking for users.

## Key Responsibilities

- Manage WebSocket connections for real-time communication
- Handle presence tracking and typing indicators
- Facilitate message broadcasting across instances
- Support connection state management

## Configuration

The WebSocket agent is configured to work with the FastAPI framework and uses the following key components:
- `app/infrastructure/ws/websocket_manager.py` for connection management
- `app/adapters/services/presence_service.py` for presence tracking
- `app/infrastructure/ws/connections.py` for connection state storage

## Usage

To use the WebSocket agent, connect to the following endpoint:

| Endpoint | Method | Description |
|---------|--------|-------------|
| `wss://novaacademy-api.example.com/ws` | WebSocket | Real-time communication endpoint |

## Integration

The WebSocket agent integrates with:
- `app/adapters/services/llm_service.py` for AI-powered features
- `app/adapters/repositories/user_repository.py` for user data
- `app/infrastructure/celery/` for background processing

## Documentation

For more information about the WebSocket implementation, see the [Architecture Deep-Dive](docs/ARCHITECTURE.md)
```