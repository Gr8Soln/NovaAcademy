from app.application.interfaces import IDocumentEmbedderInterface



class OllamaEmbedder(IDocumentEmbedderInterface):
    def __init__(self, ollama_client):
        self.ollama_client = ollama_client

    async def embed(self, text: str) -> list[float]:
       return []
    
    async def embed_multiple(self, texts: list[str]) -> list[list[float]]:
       return [[]]