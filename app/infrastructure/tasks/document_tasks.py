import asyncio
import uuid
from uuid import uuid4

from celery import shared_task

from app.adapters.services import (DocumentExtractor, OllamaEmbedder,
                                   QdrantVector)
from app.infrastructure.db import (DocumentChunkModel, DocumentModel,
                                   async_session_factory)


@shared_task(name="process_document")
def process_document(document_id: uuid.UUID):
    asyncio.run(_process_document(document_id))


async def _process_document(document_id: uuid.UUID):
    async with async_session_factory() as session:
        try:
            document = await session.get(DocumentModel, document_id)

            if not document:
                return

            document.status = "PROCESSING"
            await session.commit()

            extractor = DocumentExtractor()
            chunker = TokenChunker()
            embedder = OllamaEmbedder()

            vector_store = QdrantVector(
                url="YOUR_QDRANT_URL",
                api_key="YOUR_QDRANT_API_KEY",
                collection="novaacademy",
            )

            # 1. Extract text
            text = extractor.extract(document.file_path)

            # 2. Chunk
            chunks = chunker.chunk(text)

            # 3. Embed
            embeddings = embedder.embed_batch(chunks)

            # 4. Save chunks + upsert vectors
            points = []

            for i, (chunk, vector) in enumerate(zip(chunks, embeddings)):
                chunk_id = str(uuid4())

                db_chunk = DocumentChunkModel(
                    id=chunk_id,
                    document_id=document.id,
                    class_id=document.class_id,
                    chunk_index=i,
                    content=chunk,
                )
                session.add(db_chunk)

                points.append({
                    "id": chunk_id,
                    "vector": vector,
                    "document_id": document.id,
                    "content": chunk,
                })

            await session.commit()

            # 5. Upsert to Qdrant
            vector_store.upsert(
                namespace=document.class_id,
                points=points
            )

            document.status = "PROCESSED"
            await session.commit()

        except Exception as e:
            document.status = "FAILED"
            await session.commit()
            raise e