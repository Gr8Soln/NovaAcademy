"""Parse, chunk, embed, and store a document's content."""

from __future__ import annotations

import uuid

from app.domain.entities.document import DocumentChunk
from app.domain.exceptions import DocumentNotFoundError, DocumentProcessingError
from app.interfaces.repositories.document_repository import IDocumentRepository
from app.interfaces.repositories.vector_repository import IVectorRepository
from app.interfaces.services.document_parser_service import IDocumentParserService
from app.interfaces.services.embedding_service import IEmbeddingService


class ProcessDocumentUseCase:
    def __init__(
        self,
        document_repo: IDocumentRepository,
        vector_repo: IVectorRepository,
        parser_service: IDocumentParserService,
        embedding_service: IEmbeddingService,
    ) -> None:
        self._document_repo = document_repo
        self._vector_repo = vector_repo
        self._parser = parser_service
        self._embedder = embedding_service

    async def execute(self, document_id: uuid.UUID) -> None:
        doc = await self._document_repo.get_by_id(document_id)
        if not doc:
            raise DocumentNotFoundError(f"Document {document_id} not found")

        doc.mark_processing()
        await self._document_repo.update(doc)

        try:
            # 1. Parse file into text chunks
            parsed = await self._parser.parse(doc.file_path, doc.file_type.value)

            # 2. Build domain chunk objects
            chunks: list[DocumentChunk] = []
            texts: list[str] = []
            for i, p in enumerate(parsed):
                chunk = DocumentChunk(
                    document_id=doc.id,
                    chunk_index=i,
                    content=p.content,
                    page_number=p.page_number,
                    metadata=p.metadata or {},
                    token_count=len(p.content.split()),  # rough estimate
                )
                chunks.append(chunk)
                texts.append(p.content)

            # 3. Generate embeddings
            embeddings = await self._embedder.embed(texts)

            # 4. Store in vector DB
            collection = f"doc_{doc.id}"
            ids = [str(c.id) for c in chunks]
            metadatas = [{"page": c.page_number, "index": c.chunk_index} for c in chunks]
            await self._vector_repo.upsert(collection, ids, embeddings, texts, metadatas)

            # 5. Persist chunks in relational DB
            for chunk, emb_id in zip(chunks, ids):
                chunk.embedding_id = emb_id
            await self._document_repo.create_chunks(chunks)

            doc.mark_completed(chunk_count=len(chunks), page_count=parsed[-1].page_number if parsed else None)
            await self._document_repo.update(doc)

        except Exception as exc:
            doc.mark_failed()
            await self._document_repo.update(doc)
            raise DocumentProcessingError(str(exc)) from exc
