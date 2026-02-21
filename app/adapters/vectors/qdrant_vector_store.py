import uuid
from typing import Optional
from uuid import UUID

from app.application.interfaces import IVectorStoreInterface
from app.core.config import settings
from app.domain.entities import DocumentChunk


COLLECTION_NAME = "nova_chunks"


class QdrantVectorStore(IVectorStoreInterface):
    """
    Qdrant-backed vector store using OpenAI embeddings.

    A single collection (`nova_chunks`) stores all users' chunks.
    Each point has a payload:
        - document_id  (str UUID)
        - user_id      (str UUID)
        - class_id     (str UUID)
        - chunk_index  (int)
        - content      (str)
        - embedding_model (str)
        - embedding_dim   (int)
    """

    def __init__(self, qdrant_host: str, qdrant_port: int, openai_api_key: str) -> None:
        self._host = qdrant_host
        self._port = qdrant_port
        self._openai_key = openai_api_key
        self._client = None      # Lazy init
        self._openai_client = None

    # ── Lifecycle ─────────────────────────────────────────────────

    async def _get_client(self):
        """Lazy-init Qdrant async client and ensure collection exists."""
        if self._client is None:
            try:
                from qdrant_client import AsyncQdrantClient  # type: ignore
                from qdrant_client.models import (  # type: ignore
                    Distance,
                    VectorParams,
                )
            except ImportError as exc:
                raise RuntimeError(
                    "qdrant-client is required. Install: pip install qdrant-client"
                ) from exc

            self._client = AsyncQdrantClient(host=self._host, port=self._port)

            # Ensure collection exists
            collections = await self._client.get_collections()
            existing = {c.name for c in collections.collections}
            if COLLECTION_NAME not in existing:
                await self._client.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=VectorParams(
                        size=settings.VECTOR_SIZE,
                        distance=Distance.COSINE,
                    ),
                )

        return self._client

    def _get_openai_client(self):
        if self._openai_client is None:
            try:
                from openai import AsyncOpenAI  # type: ignore
            except ImportError as exc:
                raise RuntimeError(
                    "openai is required. Install: pip install openai"
                ) from exc
            self._openai_client = AsyncOpenAI(api_key=self._openai_key)
        return self._openai_client

    async def _embed(self, texts: list[str], model: str) -> list[list[float]]:
        """Embed a list of texts using the given model via OpenAI API."""
        client = self._get_openai_client()
        response = await client.embeddings.create(input=texts, model=model)
        return [item.embedding for item in response.data]

    # ── IVectorStoreInterface ────────────────────────────────────────

    async def upsert_chunks(
        self,
        document_id: UUID,
        user_id: UUID,
        class_id: UUID,
        chunks: list[DocumentChunk],
    ) -> list[DocumentChunk]:
        """
        Embed all chunks and upsert into Qdrant.
        Populates vector_id on each chunk and returns the updated list.
        """
        if not chunks:
            return chunks

        from qdrant_client.models import PointStruct  # type: ignore

        qdrant = await self._get_client()

        texts = [c.content for c in chunks]
        # MUST use the same model stored on the chunk
        model = chunks[0].embedding_model
        vectors = await self._embed(texts, model)

        points = []
        for chunk, vector in zip(chunks, vectors):
            point_id = uuid.uuid4()
            chunk.assign_vector_id(point_id)
            points.append(
                PointStruct(
                    id=str(point_id),
                    vector=vector,
                    payload={
                        "document_id": str(document_id),
                        "user_id": str(user_id),
                        "class_id": str(class_id),
                        "chunk_id": str(chunk.id),
                        "chunk_index": chunk.chunk_index,
                        "content": chunk.content,
                        "embedding_model": chunk.embedding_model,
                        "embedding_dim": chunk.embedding_dim,
                    },
                )
            )

        await qdrant.upsert(collection_name=COLLECTION_NAME, points=points)
        return chunks

    async def delete_document_vectors(self, document_id: UUID) -> None:
        """Delete all Qdrant points whose payload.document_id matches."""
        from qdrant_client.models import FieldCondition, Filter, MatchValue  # type: ignore

        qdrant = await self._get_client()
        await qdrant.delete(
            collection_name=COLLECTION_NAME,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=str(document_id)),
                    )
                ]
            ),
        )

    async def search(
        self,
        query: str,
        user_id: UUID,
        top_k: int = 5,
        class_id: Optional[UUID] = None,
    ) -> list[dict]:
        """
        Embed query and retrieve the top-k most similar chunks.

        IMPORTANT: Uses settings.EMBEDDING_MODEL to embed the query.
        This MUST match the model recorded in the indexed chunks' embedding_model
        field. If they differ, results will be semantically meaningless.
        """
        from qdrant_client.models import FieldCondition, Filter, MatchValue  # type: ignore

        qdrant = await self._get_client()

        query_vector = (await self._embed([query], settings.EMBEDDING_MODEL))[0]

        must_conditions = [
            FieldCondition(key="user_id", match=MatchValue(value=str(user_id)))
        ]
        if class_id:
            must_conditions.append(
                FieldCondition(key="class_id", match=MatchValue(value=str(class_id)))
            )

        results = await qdrant.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_vector,
            query_filter=Filter(must=must_conditions),
            limit=top_k,
            with_payload=True,
        )

        return [
            {
                "chunk_id": hit.payload.get("chunk_id"),
                "document_id": hit.payload.get("document_id"),
                "content": hit.payload.get("content"),
                "score": hit.score,
                "embedding_model": hit.payload.get("embedding_model"),
                "chunk_index": hit.payload.get("chunk_index"),
            }
            for hit in results
        ]
