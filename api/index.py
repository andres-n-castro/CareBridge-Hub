"""
Vercel serverless entry point for the CareBridge FastAPI backend.

Vercel routes /api/* here and passes the full path (including /api) in the
ASGI scope.  _StripPrefix removes the /api prefix so FastAPI's existing
routes (/sessions/..., /auth/..., /media/...) match without modification.
"""
import os
import sys

# Make `app.*` importable from the Backend directory.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "Backend"))

from app.main import app as _backend_app  # noqa: E402


class _StripPrefix:
    """Lightweight ASGI middleware that strips a path prefix before
    forwarding to the wrapped application."""

    def __init__(self, app, prefix: str = "/api"):
        self.app = app
        self.prefix = prefix
        self.prefix_bytes = prefix.encode()

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            path: str = scope.get("path", "")
            if path.startswith(self.prefix):
                new_path = path[len(self.prefix):] or "/"
                raw = scope.get("raw_path", b"")
                new_raw = (
                    raw[len(self.prefix_bytes):]
                    if raw.startswith(self.prefix_bytes)
                    else raw
                ) or b"/"
                scope = {**scope, "path": new_path, "raw_path": new_raw}
        await self.app(scope, receive, send)


# `app` is the symbol Vercel's Python runtime looks for.
app = _StripPrefix(_backend_app, prefix="/api")
