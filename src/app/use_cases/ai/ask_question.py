"""RAG Q&A — retrieve relevant chunks then stream an LLM answer."""

from __future__ import annotations

import uuid
from typing import AsyncIterator

from app.domain.exceptions import DocumentNotFoundError
from app.interfaces.repositories.document_repository import IDocumentRepository
from app.interfaces.repositories.vector_repository import IVectorRepository
from app.interfaces.services.embedding_service import IEmbeddingService
from app.interfaces.services.llm_service import ILLMService


_SYSTEM_PROMPT = (
    "You are a helpful AI tutor. Answer the student's question based ONLY on the "
    "provided context from their study materials. If the context does not contain "
    "enough information, say so honestly. Use clear, educational language."
)


class AskQuestionUseCase:
    def __init__(
        self,
        document_repo: IDocumentRepository,
        vector_repo: IVectorRepository,
        embedding_service: IEmbeddingService,
        llm_service: ILLMService,
    ) -> None:
        self._document_repo = document_repo
        self._vector_repo = vector_repo
        self._embedder = embedding_service
        self._llm = llm_service

    async def execute(
        self,
        document_id: uuid.UUID,
        question: str,
        top_k: int = 5,
    ) -> AsyncIterator[str]:
        doc = await self._document_repo.get_by_id(document_id)
        if not doc:
            raise DocumentNotFoundError(f"Document {document_id} not found")

        # 1. Embed the question
        query_embedding = await self._embedder.embed_query(question)

        # 2. Retrieve relevant chunks
        collection = f"doc_{doc.id}"
        results = await self._vector_repo.search(collection, query_embedding, top_k=top_k)

        # 3. Build prompt with retrieved context
        context_block = "\n\n---\n\n".join(r.content for r in results)
        prompt = (
            f"Context from the student's study material:\n\n{context_block}\n\n"
            f"Student's question: {question}\n\n"
            "Provide a thorough, well-structured answer."
        )

        # 4. Stream LLM response
        async for token in self._llm.generate_stream(prompt, system_prompt=_SYSTEM_PROMPT):
            yield token
