from .routes.auth_router import router as auth_router
from .routes.chat_router import router as chat_router
from .routes.document_router import router as document_router
from .routes.file_router import router as file_router
from .routes.user_router import router as user_router

__all__ = [
    "auth_router",
    "file_router",
    "chat_router",
    "document_router",
    "user_router",
]