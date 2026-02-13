"""Qdrant vector repository implementation."""

from __future__ import annotations

from typing import List, Optional

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from app.interfaces.repositories.vector_repository import IVectorRepository, VectorSearchResult


class QdrantVectorRepository(IVectorRepository):
    def __init__(self, client: AsyncQdrantClient, vector_size: int = 1536) -> None:
        self._client = client
        self._vector_size = vector_size

    async def _ensure_collection(self, collection: str) -> None:
        collections = await self._client.get_collections()
        names = [c.name for c in collections.collections]
        if collection not in names:
            await self._client.create_collection(
                collection_name=collection,
                vectors_config=VectorParams(size=self._vector_size, distance=Distance.COSINE),
            )

    async def upsert(
        self,
        collection: str,
        ids: List[str],
        embeddings: List[List[float]],
        documents: List[str],
        metadatas: Optional[List[dict]] = None,
    ) -> None:
        await self._ensure_collection(collection)
        points = [
            PointStruct(
                id=id_,
                vector=emb,
                payload={"content": doc, **(meta or {})},
            )
            for id_, emb, doc, meta in zip(
                ids, embeddings, documents, metadatas or [{}] * len(ids)
            )
        ]
        await self._client.upsert(collection_name=collection, points=points)

    async def search(
        self,
        collection: str,
        query_embedding: List[float],
        top_k: int = 5,
    ) -> List[VectorSearchResult]:
        results = await self._client.search(
            collection_name=collection,
            query_vector=query_embedding,
            limit=top_k,
        )
        return [
            VectorSearchResult(
                chunk_id=str(r.id),
                content=r.payload.get("content", ""),
                score=r.score,
                metadata={k: v for k, v in r.payload.items() if k != "content"},
            )
            for r in results
        ]

    async def delete(self, collection: str, ids: List[str]) -> None:
        await self._client.delete(
            collection_name=collection,
            points_selector=ids,
        )

    async def delete_collection(self, collection: str) -> None:
        await self._client.delete_collection(collection_name=collection)
