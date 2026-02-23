import asyncio
import uuid
from uuid import uuid4

from celery import shared_task

from app.adapters.services import (DocumentExtractor, OllamaEmbedder,
                                   QdrantVector)
from app.infrastructure.db import (DocumentModel,
                                   async_session_factory)


@shared_task(name="process_document")
def process_document(document_id: uuid.UUID):
    asyncio.run(_process_document(document_id))


async def _process_document(document_id: uuid.UUID):
    async with async_session_factory() as session:
        try:
            pass
            
            
            
        except Exception as e:
            pass
            # document.status = "FAILED"
            # await session.commit()
            # raise e