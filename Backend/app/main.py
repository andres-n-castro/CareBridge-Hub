import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

from app.routes.patients import router as patient_router
from app.routes.auth import router as auth_router
from app.routes.sessions import router as sessions_router
from app.routes.media import router as media_router
from app.routes.svi import router as svi_router

app = FastAPI(title="CareBridge API")
app.include_router(patient_router)
app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(svi_router)
app.include_router(media_router)

# ALLOWED_ORIGIN can be set to your Vercel URL in production (e.g. https://your-app.vercel.app).
# Defaults to "*" for local development.
_raw_origin = os.getenv("ALLOWED_ORIGIN", "*")
_allowed_origins = [o.strip() for o in _raw_origin.split(",")] if _raw_origin != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "CareBridge API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
