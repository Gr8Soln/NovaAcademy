```markdown
# NovaAcademy API Agent

## Overview

The NovaAcademy API Agent handles all RESTful API endpoints for the application. It provides a clean interface for interacting with the backend services, including document processing, user authentication, and real-time collaboration features.

## Key Responsibilities

- Expose endpoints for document upload and processing
- Handle user authentication and session management
- Provide access to the vector search capabilities
- Support real-time collaboration through WebSocket integration

## Configuration

The API agent is configured to work with the FastAPI framework and uses the following key components:
- `src/core/config.py` for configuration settings
- `src/infrastructure/api/` for route definitions
- `src/adapters/services/` for business logic implementations

## Usage

To interact with the API agent, use the following endpoints:

| Endpoint | Method | Description |
|---------|--------|-------------|
| `/api/v1/docs` | GET | Swagger API documentation |
| `/api/v1/upload` | POST | Upload and process documents |
| `/api/v1/auth/login` | POST | User authentication |
| `/api/v1/classes` | GET | List available classes |

## Integration

The API agent integrates with:
- `src/adapters/services/llm_service.py` for AI-powered features
- `src/adapters/repositories/vector_repository.py` for vector search capabilities
- `src/infrastructure/ws/` for WebSocket connections

## Documentation

For more information about the API, see the [API Documentation](https://novaacademy-api.example.com/api/v1/docs)
```