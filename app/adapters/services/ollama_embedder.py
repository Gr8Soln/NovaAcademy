from typing import Optional

from ollama import AsyncClient

from app.application.interfaces import IDocumentEmbedderInterface
from app.core.config import settings


class OllamaEmbedder(IDocumentEmbedderInterface):
    def __init__(
        self,
        model: Optional[str] = None,
        host: Optional[str] = None,
    ):
        self.model = model or settings.OLLAMA_EMBEDDING_MODEL
        host = host or settings.OLLAMA_HOST
        self._client = AsyncClient(host=host)

    async def embed(self, text: str) -> tuple[str, list[float]]:
        """Embed a single text string and return (text, vector)."""
        response = await self._client.embed(model=self.model, input=text)
        return text, list(response.embeddings[0])

    async def embed_multiple(self, texts: list[str]) -> list[tuple[str, list[float]]]:
        """Embed multiple texts and return a list of (text, vector) tuples."""
        response = await self._client.embed(model=self.model, input=texts)
        return [(text, list(emb)) for text, emb in zip(texts, response.embeddings)]