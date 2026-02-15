from qdrant_client import AsyncQdrantClient

from app.core.config import settings

qdrant_client = AsyncQdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)


async def get_qdrant() -> AsyncQdrantClient:
    return qdrant_client
