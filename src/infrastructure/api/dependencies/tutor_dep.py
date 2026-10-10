from fastapi import Depends

from app.adapters.services.llm_service import OllamaLLM, OpenAILLM
from app.application.interfaces.llm_interface import ILLMInterface
from app.application.use_cases.tutor_usecases import TutorUseCase
from app.application.use_cases.document_usecases import SearchDocumentsUseCase
from app.core.config import Settings, get_settings
from app.infrastructure.api.dependencies.document_dep import get_search_documents_usecase


def get_llm_service(settings: Settings = Depends(get_settings)) -> ILLMInterface:
    if settings.OPENAI_API_KEY:
        return OpenAILLM(api_key=settings.OPENAI_API_KEY, model=settings.OPENAI_MODEL)
    else:
        return OllamaLLM(host=settings.OLLAMA_HOST, model=settings.OLLAMA_CHAT_MODEL)


def get_tutor_usecase(
    llm: ILLMInterface = Depends(get_llm_service),
    search_use_case: SearchDocumentsUseCase = Depends(get_search_documents_usecase),
) -> TutorUseCase:
    return TutorUseCase(llm=llm, search_use_case=search_use_case)
