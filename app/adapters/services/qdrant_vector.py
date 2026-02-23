import uuid
from typing import Optional

from qdrant_client import QdrantClient, models

from app.application.interfaces import IVectorStoreInterface
from app.core.config import settings
from app.domain.entities import DocumentChunksAndEmbeddings


class QdrantVector(IVectorStoreInterface):
    def __init__(self, host: str, port: int, api_key: Optional[str] = None):
        self._client = QdrantClient(
            host=host,
            port=port,
            api_key=api_key,
        )
        
        if not self._client.collection_exists(settings.QDRANT_COLLECTION_NAME):
            self._client.create_collection(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            vectors_config=models.VectorParams(
                size=settings.QDRANT_VECTOR_SIZE, distance=models.Distance.COSINE
            ),
        )

    async def store_embeddings(
        self,
        data: DocumentChunksAndEmbeddings
    ):
        from qdrant_client.models import PointStruct 
        
        document_id = data.document_id
        user_id = data.user_id
        class_id = data.class_id
        embedding_model = data.embedding_model
        embedding_dim = data.embedding_dim
        created_at = str(data.created_at)
        embedded_chunks = data.embedded_chunks
    
        points = []
      
        for embedded_chunk in embedded_chunks:
            point_id = uuid.uuid4()
            points.append(
                PointStruct(
                    id=str(point_id),
                    vector=embedded_chunk.embedding,
                    payload={
                        "document_id": document_id,
                        "user_id": user_id,
                        "class_id": class_id,
                        "chunk_index": embedded_chunk.index,
                        "content": embedded_chunk.chunk,
                        "embedding_model": embedding_model,
                        "embedding_dim": embedding_dim,
                        "created_at": created_at
                    },
                )
            )

            
        self._client.upsert(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            points=points,
        )

    async def delete_embeddings(self, document_id: str) -> None:
        from qdrant_client.models import FieldCondition, Filter, MatchValue

        self._client.delete(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id),
                    )
                ]
            ),
        )


    async def search_embeddings(
        self,
        embedded_query: list[float],
        top_k: int = 5,
        user_id: Optional[str] = None,
        class_id: Optional[str] = None,
        document_id: Optional[str] = None,
    ) -> list[dict]:
        from qdrant_client.models import FieldCondition, Filter, MatchValue

        must_conditions = []

        if user_id:
            must_conditions.append(
                FieldCondition(key="user_id", match=MatchValue(value=user_id))
            )
        
        if class_id:
            must_conditions.append(
                FieldCondition(key="class_id", match=MatchValue(value=class_id))
            )

        if document_id:
            must_conditions.append(
                FieldCondition(key="document_id", match=MatchValue(value=document_id))
            )

        results = self._client.query_points(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            query=embedded_query,
            query_filter=Filter(must=must_conditions),
            limit=top_k,
            with_payload=True,
        )

        result_list = []
        for r in results.points:
            payload = r.payload or {}
            result_list.append({
                "chunk_index": payload.get("chunk_index"),
                "document_id": payload.get("document_id"),
                "class_id": payload.get("class_id"),
                "user_id": payload.get("user_id"),
                "content": payload.get("content", ""),
                "score": r.score,
                "embedding_model": payload.get("embedding_model", "unknown"),
                "embedding_dim": payload.get("embedding_dim", 0),
            })
        return result_list
