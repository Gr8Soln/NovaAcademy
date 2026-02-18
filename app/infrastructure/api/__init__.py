from .routes.auth_router import router as auth_router
from .routes.user_router import router as user_router

__all__ = [
    "auth_router",
    "user_router",
]