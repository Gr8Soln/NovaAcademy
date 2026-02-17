import uvicorn

from app.core.config import settings
from app.infrastructure.setup import create_app

app = create_app()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
