import os
import secrets
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/auth", tags=["auth"])

_NURSE_EMAIL = os.getenv("NURSE_EMAIL", "nurse@carebridge.com")
_NURSE_PASSWORD = os.getenv("NURSE_PASSWORD", "password123")
_NURSE_NAME = os.getenv("NURSE_NAME", "Demo Nurse")

_tokens: dict[str, dict] = {}


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
async def login(payload: LoginRequest):
    email_match = secrets.compare_digest(payload.email, _NURSE_EMAIL)
    password_match = secrets.compare_digest(payload.password, _NURSE_PASSWORD)
    if not (email_match and password_match):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = str(uuid.uuid4())
    _tokens[token] = {"email": _NURSE_EMAIL, "name": _NURSE_NAME}

    return {
        "token": token,
        "nurse": {"name": _NURSE_NAME, "email": _NURSE_EMAIL},
    }
