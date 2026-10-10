from .routes.auth_router import router as auth_router
from .routes.ai_router import router as ai_router
from .routes.analytics_router import router as analytics_router
from .routes.chat_router import router as chat_router
from .routes.document_router import router as document_router
from .routes.personal_document_router import router as personal_document_router
from .routes.file_router import router as file_router
from .routes.study_router import router as study_router
from .routes.user_router import router as user_router

__all__ = [
    "auth_router",
    "analytics_router",
    "chat_router",
    "document_router",
    "personal_document_router",
    "file_router",
    "study_router",
    "user_router",
]