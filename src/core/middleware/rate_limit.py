import time
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

class SimpleRateLimiter(BaseHTTPMiddleware):
    """Very simple in‑memory rate limiter.
    Not suitable for production clusters but works for local dev/tests.
    It respects the configuration flags in Settings.
    """

    def __init__(self, app, settings):
        super().__init__(app)
        self.settings = settings
        # Store counters: {(client_ip, endpoint): (reset_timestamp, count)}
        self.counters: dict[tuple[str, str], tuple[float, int]] = {}

    async def dispatch(self, request: Request, call_next):
        if not getattr(self.settings, "ENABLE_RATE_LIMITING", False):
            return await call_next(request)

        client_ip = request.client.host if request.client else "anonymous"
        path = request.url.path
        now = time.time()
        limit = (
            self.settings.RATE_LIMIT_API_PER_MINUTE
            if path.startswith(self.settings.API_PREFIX)
            else self.settings.RATE_LIMIT_MESSAGES_PER_MINUTE
        )
        key = (client_ip, path)
        reset, count = self.counters.get(key, (now + 60, 0))
        if now > reset:
            reset = now + 60
            count = 0
        if count >= limit:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        self.counters[key] = (reset, count + 1)
        response = await call_next(request)
        return response
}
