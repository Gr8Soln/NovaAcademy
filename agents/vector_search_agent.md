```markdown
# NovaAcademy Vector Search Agent

## Overview

The Vector Search agent provides semantic search capabilities for the NovaAcademy application. It enables efficient retrieval of documents based on semantic similarity using the Qdrant vector database.

## Key Responsibilities

- Index documents for semantic search
- Execute vector similarity searches
- Support document chunking and indexing
- Provide search results with relevance scoring

## Configuration

The Vector Search agent is configured to work with the Qdrant vector database and uses the following key components:
- `app/infrastructure/db/vector_db.py` for database connections
- `app/adapters/services/vector_service.py` for search operations
- `app/infrastructure/tasks/` for background indexing

## Usage

To use the Vector Search agent, interact with the following endpoints:

| Endpoint | Method | Description |
|---------|--------|-------------|
| `/api/v1/search` | POST | Execute semantic search query |
| `/api/v1/index` | POST | Index new documents |

## Integration

The Vector Search agent integrates with:
- `app/adapters/repositories/document_repository.py` for document storage
- `app/infrastructure/websocket/` for real-time search updates
- `app/infrastructure/celery/` for background indexing

## Documentation

For more information about the vector search implementation, see the [Architecture Deep-Dive](docs/ARCHITECTURE.md)
```