import uuid
from fastapi import APIRouter, UploadFile, File

router = APIRouter(prefix="/media", tags=["media"])


@router.post("/upload")
async def upload_media(file: UploadFile = File(...)):
    return {
        "media_id": str(uuid.uuid4()),
        "filename": file.filename,
        "content_type": file.content_type,
    }
