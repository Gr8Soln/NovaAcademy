"""OpenAI embedding service implementation."""

from __future__ import annotations

from typing import List, Optional

import openai

from app.interfaces.services.embedding_service import IEmbeddingService


class OpenAIEmbeddingService(IEmbeddingService):
    def __init__(
        self,
        api_key: str,
        model: str = "text-embedding-3-small",
        base_url: Optional[str] = None,
    ) -> None:
        self._client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url)
        self._model = model

    async def embed(self, texts: List[str]) -> List[List[float]]:
        response = await self._client.embeddings.create(model=self._model, input=texts)
        return [item.embedding for item in response.data]

    async def embed_query(self, text: str) -> List[float]:
        result = await self.embed([text])
        return result[0]
