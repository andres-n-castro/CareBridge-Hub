import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db import get_db
from app.schemas.patient import PatientCreate, PatientOut

router = APIRouter(prefix="/sessions", tags=["sessions"])

_session_state: dict[int, dict] = {}
_finalized: set[int] = set()


def _get_status(session_id: int) -> str:
    return _session_state.get(session_id, {}).get("status", "ready")


def _get_progress(session_id: int) -> int:
    return _session_state.get(session_id, {}).get("progress", 100)


async def _fetch_patient(session_id: int, db: AsyncSession):
    result = await db.execute(
        text("SELECT id FROM patients WHERE id = :id"),
        {"id": session_id},
    )
    row = result.mappings().one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return row


@router.get("")
async def list_sessions(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("""
            SELECT id,
                   patient_info->>'name' AS name,
                   (patient_info->>'room_num')::int AS room_num,
                   updated_at
            FROM patients
            ORDER BY updated_at DESC
            LIMIT :limit OFFSET :offset
        """),
        {"limit": limit, "offset": offset},
    )
    rows = result.mappings().all()
    return [
        {
            "id": int(row["id"]),
            "name": row["name"],
            "room_num": row["room_num"],
            "updated_at": row["updated_at"],
            "status": _get_status(int(row["id"])),
            "progress": _get_progress(int(row["id"])),
        }
        for row in rows
    ]


@router.post("/{session_id}/start")
async def start_recording(session_id: int, db: AsyncSession = Depends(get_db)):
    await _fetch_patient(session_id, db)
    _session_state[session_id] = {"status": "recording", "progress": 0}
    return {"id": session_id, "status": "recording", "progress": 0}


@router.post("/{session_id}/stop")
async def stop_recording(session_id: int, db: AsyncSession = Depends(get_db)):
    await _fetch_patient(session_id, db)
    _session_state[session_id] = {"status": "stopped", "progress": 50}
    return {"id": session_id, "status": "stopped", "progress": 50}


@router.post("/{session_id}/process")
async def process_session(session_id: int, db: AsyncSession = Depends(get_db)):
    await _fetch_patient(session_id, db)
    _session_state[session_id] = {"status": "ready", "progress": 100}
    return {"id": session_id, "status": "ready", "progress": 100}


@router.get("/{session_id}/status")
async def get_status(session_id: int, db: AsyncSession = Depends(get_db)):
    await _fetch_patient(session_id, db)
    return {
        "id": session_id,
        "status": _get_status(session_id),
        "progress": _get_progress(session_id),
    }


@router.get("/{session_id}/transcript")
async def get_transcript(session_id: int, db: AsyncSession = Depends(get_db)):
    await _fetch_patient(session_id, db)
    return {
        "id": session_id,
        "transcript": "Placeholder transcript: nurse reviewed patient vitals and updated care plan.",
    }


@router.get("/{session_id}/form", response_model=PatientOut)
async def get_form(session_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            SELECT id, nurse, patient_info, background, current_assessment
            FROM patients
            WHERE id = :id
        """),
        {"id": session_id},
    )
    row = result.mappings().one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return PatientOut(
        id=int(row["id"]),
        nurse=row["nurse"],
        patient_info=row["patient_info"],
        background=row["background"],
        current_assessment=row["current_assessment"],
    )


@router.put("/{session_id}/form", response_model=PatientOut)
async def update_form(
    session_id: int,
    payload: PatientCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("""
            UPDATE patients
            SET nurse              = CAST(:nurse AS JSONB),
                patient_info       = CAST(:patient_info AS JSONB),
                background         = CAST(:background AS JSONB),
                current_assessment = CAST(:current_assessment AS JSONB),
                updated_at         = now()
            WHERE id = :id
            RETURNING id, nurse, patient_info, background, current_assessment
        """),
        {
            "id": session_id,
            "nurse": json.dumps(payload.nurse.model_dump()),
            "patient_info": json.dumps(payload.patient_info.model_dump()),
            "background": json.dumps(payload.background.model_dump()),
            "current_assessment": json.dumps(payload.current_assessment.model_dump()),
        },
    )
    row = result.mappings().one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.commit()
    return PatientOut(
        id=int(row["id"]),
        nurse=row["nurse"],
        patient_info=row["patient_info"],
        background=row["background"],
        current_assessment=row["current_assessment"],
    )


@router.post("/{session_id}/finalize")
async def finalize_session(session_id: int, db: AsyncSession = Depends(get_db)):
    await _fetch_patient(session_id, db)
    _finalized.add(session_id)
    return {"id": session_id, "status": "final"}
