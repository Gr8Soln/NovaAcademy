import json
from typing import AsyncGenerator, Optional

import httpx
from openai import AsyncOpenAI

from app.application.interfaces.llm_interface import ILLMInterface
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class OpenAILLM(ILLMInterface):
    """OpenAI implementation of the LLM interface."""

    def __init__(self, api_key: str, model: str = "gpt-4") -> None:
        self._client = AsyncOpenAI(api_key=api_key)
        self._model = model

    async def complete(
        self, 
        prompt: str, 
        system_message: Optional[str] = None, 
        max_tokens: int = 1000
    ) -> str:
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})

        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.7,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"OpenAI completion error: {e}")
            raise


    async def complete_stream(
        self, 
        prompt: str, 
        system_message: Optional[str] = None, 
        max_tokens: int = 1000
    ) -> AsyncGenerator[str, None]:
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})

        try:
            stream = await self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.7,
                stream=True,
            )
            async for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
        except Exception as e:
            logger.error(f"OpenAI stream completion error: {e}")
            raise


class OllamaLLM(ILLMInterface):
    """Ollama implementation of the LLM interface."""

    def __init__(self, host: str, model: str) -> None:
        self._host = host.rstrip("/")
        self._model = model

    async def complete(
        self, 
        prompt: str, 
        system_message: Optional[str] = None, 
        max_tokens: int = 1000
    ) -> str:
        url = f"{self._host}/api/chat"
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self._model,
            "messages": messages,
            "stream": False,
            "options": {"num_predict": max_tokens}
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                return data["message"]["content"]
            except Exception as e:
                logger.error(f"Ollama completion error: {e}")
                raise

    async def complete_stream(
        self, 
        prompt: str, 
        system_message: Optional[str] = None, 
        max_tokens: int = 1000
    ) -> AsyncGenerator[str, None]:
        url = f"{self._host}/api/chat"
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self._model,
            "messages": messages,
            "stream": True,
            "options": {"num_predict": max_tokens}
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                async with client.stream("POST", url, json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        chunk = json.loads(line)
                        if "message" in chunk and "content" in chunk["message"]:
                            yield chunk["message"]["content"]
                        if chunk.get("done"):
                            break
            except Exception as e:
                logger.error(f"Ollama stream completion error: {e}")
                raise
