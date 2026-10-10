import uvicorn

from src.core.config import settings
from src.infrastructure.setup import create_app

app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        reload_dirs=["app"],
    )
