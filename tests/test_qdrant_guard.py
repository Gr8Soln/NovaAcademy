import pytest
from unittest.mock import MagicMock, patch

from app.adapters.services.qdrant_vector import QdrantVector

class DummyClient:
    def __init__(self, *args, **kwargs):
        pass
    def collection_exists(self, name):
        raise RuntimeError("Connection error")
    def create_collection(self, *args, **kwargs):
        pass

def test_qdrant_collection_guard_logs(monkeypatch, caplog):
    # Patch QdrantClient to use DummyClient that raises on collection_exists
    monkeypatch.setattr('app.adapters.services.qdrant_vector.QdrantClient', DummyClient)
    # Instantiate should not raise despite the error
    vec = QdrantVector(host='localhost', port=6333)
    # Ensure an error was logged
    assert any('Failed to ensure Qdrant collection exists' in rec.message for rec in caplog.records)
