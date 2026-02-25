import uuid
from typing import AsyncGenerator, List, Optional

from app.application.interfaces.llm_interface import ILLMInterface
from app.application.use_cases.document_usecases import SearchDocumentsUseCase


class TutorUseCase:
    """Provides document-aware tutoring using semantic search and LLM."""

    SYSTEM_PROMPT = """You are Nova, an expert AI tutor at Nova Academy. 
Your goal is to help students understand their study materials.
You will be provided with context from the student's documents.
Use this context to answer their questions accurately and concisely.
If the answer isn't in the context, use your general knowledge but mention that it might not be in the specific material.
Always be encouraging, professional, and educational."""

    def __init__(
        self, 
        llm: ILLMInterface, 
        search_use_case: SearchDocumentsUseCase
    ) -> None:
        self._llm = llm
        self._search_use_case = search_use_case

    async def execute(
        self, 
        question: str, 
        user_id: uuid.UUID,
        document_id: Optional[uuid.UUID] = None,
        class_id: Optional[uuid.UUID] = None,
        top_k: int = 5
    ) -> str:
        # 1. Retrieve relevant context
        context_chunks = await self._search_use_case.execute(
            query=question,
            user_id=user_id,
            class_id=class_id,
            top_k=top_k
        )
        
        # If document_id is provided, we could filter here 
        # (though search_embeddings supports document_id as well)
        if document_id:
            context_chunks = [c for c in context_chunks if c.get("document_id") == str(document_id)]

        # 2. Format context for prompt
        context_text = "\n\n".join([c["content"] for c in context_chunks])
        
        prompt = f"Context from study materials:\n{context_text}\n\nQuestion: {question}"

        # 3. Get LLM completion
        return await self._llm.complete(prompt, system_message=self.SYSTEM_PROMPT)

    async def execute_stream(
        self, 
        question: str, 
        user_id: uuid.UUID,
        document_id: Optional[uuid.UUID] = None,
        class_id: Optional[uuid.UUID] = None,
        top_k: int = 5
    ) -> AsyncGenerator[str, None]:
        # 1. Retrieve relevant context
        context_chunks = await self._search_use_case.execute(
            query=question,
            user_id=user_id,
            class_id=class_id,
            top_k=top_k
        )
        
        if document_id:
            context_chunks = [c for c in context_chunks if c.get("document_id") == str(document_id)]

        # 2. Format context for prompt
        context_text = "\n\n".join([c["content"] for c in context_chunks])
        
        prompt = f"Context from study materials:\n{context_text}\n\nQuestion: {question}"

        # 3. Stream LLM completion
        async for chunk in self._llm.complete_stream(prompt, system_message=self.SYSTEM_PROMPT):
            yield chunk
