```markdown
# NovaAcademy Celery Agent

## Overview

The Celery agent handles background processing tasks for the NovaAcademy application. It enables asynchronous document processing, queue management, and periodic task execution.

## Key Responsibilities

- Process uploaded documents in the background
- Manage task queues for asynchronous operations
- Execute periodic maintenance tasks
- Support task retries and error handling

## Configuration

The Celery agent is configured to work with the Celery framework and uses the following key components:
- `src/infrastructure/tasks/` for task definitions
- `src/adapters/services/document_service.py` for document processing
- `src/infrastructure/celery/beat.py` for task scheduling

## Usage

To interact with the Celery agent, use the following commands:

```bash
# Start Celery worker
celery -A app.infrastructure.celery_app.celery_app worker --loglevel=info

# Start Celery beat
celery -A app.infrastructure.celery_app.celery_app beat --loglevel=info
```

## Integration

The Celery agent integrates with:
- `src/adapters/repositories/document_repository.py` for document storage
- `src/infrastructure/websocket/` for real-time notifications
- `src/infrastructure/db/` for database operations

## Documentation

For more information about the Celery implementation, see the [Deployment Guide](docs/DEPLOYMENT.md)
```