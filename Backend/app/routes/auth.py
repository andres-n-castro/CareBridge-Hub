import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

_CREDENTIALS: dict[str, dict] = {
    "nurse@carebridge.com": {"password": "password123", "name": "Demo Nurse"},
}

_tokens: dict[str, dict] = {}


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
async def login(payload: LoginRequest):
    user = _CREDENTIALS.get(payload.email)
    if not user or user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = str(uuid.uuid4())
    _tokens[token] = {"email": payload.email, "name": user["name"]}

    return {
        "token": token,
        "nurse": {"name": user["name"], "email": payload.email},
    }
