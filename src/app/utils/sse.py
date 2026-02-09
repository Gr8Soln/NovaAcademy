"""Server-Sent Events (SSE) helper for streaming LLM responses."""

from __future__ import annotations

import json
from typing import AsyncIterator


async def sse_stream(token_iterator: AsyncIterator[str]) -> AsyncIterator[str]:
    """Wrap an async token iterator into SSE format.

    Each token is sent as:
        data: {"token": "..."}\\n\\n

    The stream ends with:
        data: [DONE]\\n\\n
    """
    try:
        async for token in token_iterator:
            payload = json.dumps({"token": token})
            yield f"data: {payload}\n\n"
    except Exception as exc:
        error_payload = json.dumps({"error": str(exc)})
        yield f"data: {error_payload}\n\n"
    finally:
        yield "data: [DONE]\n\n"
