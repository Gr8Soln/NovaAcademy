```markdown
# NovaAcademy Agents Overview

## Agent Summary

| Agent Name         | Primary Function                         | Key Components                                  |
|-------------------|------------------------------------------|-------------------------------------------------
| API Agent          | Handles RESTful API endpoints            | FastAPI, Authentication, Vector Search         |
| WebSocket Agent   | Manages real-time communication         | WebSocket connections, Presence Tracking       |
| Celery Agent      | Handles background processing           | Document Processing, Task Scheduling           |
| Vector Search Agent | Provides semantic search capabilities | Qdrant Integration, Document Indexing          |
| Frontend Agent    | Manages the React user interface        | React Components, State Management            |

## Agent Interactions

The agents interact through the following key pathways:

1. **API ↔ WebSocket**: Real-time updates are pushed through WebSocket when API changes occur
2. **Celery ↔ Vector Search**: Document indexing is handled by Celery tasks that update the vector database
3. **Frontend ↔ API**: The frontend communicates with the API for all user interactions
4. **Frontend ↔ WebSocket**: Real-time collaboration features use WebSocket for instant updates

## Agent Architecture

The agents follow the clean architecture pattern:

```
Frontend (React) ↔ API (FastAPI) ↔ [Celery Worker] ↔ [Vector Search] ↔ [WebSocket]
```

## Documentation

For more information about each agent, see their respective documentation files:
- [API Agent](agents/api_agent.md)
- [WebSocket Agent](agents/websocket_agent.md)
- [Celery Agent](agents/celery_agent.md)
- [Vector Search Agent](agents/vector_search_agent.md)
- [Frontend Agent](agents/frontend_agent.md)
```