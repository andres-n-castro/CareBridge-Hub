import json
import logging
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db import get_db
from app.schemas.patient import PatientCreate, PatientOut
from app.stt.transcriber import transcribe_audio
from app.RAG import compiled_graph

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sessions", tags=["sessions"])

# In-memory state for actively-processing sessions (supplements DB persistence).
_session_state: dict[int, dict] = {}


@router.post("", status_code=201)
async def create_session(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            INSERT INTO patients (
                nurse, patient_info, background, current_assessment, vital_signs,
                medications, status, progress
            ) VALUES (
                '{"name":"Unknown"}'::jsonb,
                '{"name":"Unknown","DOB":0,"room_num":0,"allergies":"None","code_status":"Full","reason_for_admission":null,"geo_location":null}'::jsonb,
                '{"past_medical_history":null,"hospital_day":null,"procedures":null}'::jsonb,
                '{"pain_level_0_10":null,"additional_info":null}'::jsonb,
                '{"temp_c":null,"hr_bpm":null,"rr_bpm":null,"bp_sys":null,"bp_dia":null}'::jsonb,
                '[]'::jsonb,
                'pending',
                0
            )
            RETURNING id
        """)
    )
    row = result.mappings().one()
    await db.commit()
    session_id = int(row["id"])
    _session_state[session_id] = {"status": "pending", "progress": 0}
    return {"id": session_id}


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
                   updated_at,
                   status,
                   progress
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
            # Prefer in-memory state for actively-processing sessions,
            # fall back to persisted DB value for completed/restarted ones.
            "status": _session_state.get(int(row["id"]), {}).get("status") or row["status"],
            "progress": _session_state.get(int(row["id"]), {}).get("progress") or row["progress"],
        }
        for row in rows
    ]


@router.post("/{session_id}/start")
async def start_recording(session_id: int, db: AsyncSession = Depends(get_db)):
    await _fetch_patient(session_id, db)
    _session_state[session_id] = {"status": "recording", "progress": 0}
    await db.execute(
        text("UPDATE patients SET status = 'recording', progress = 0, updated_at = now() WHERE id = :id"),
        {"id": session_id},
    )
    await db.commit()
    return {"id": session_id, "status": "recording", "progress": 0}


@router.post("/{session_id}/stop")
async def stop_recording(
    session_id: int,
    audio_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    await _fetch_patient(session_id, db)
    _session_state[session_id] = {"status": "processing", "progress": 25}
    await db.execute(
        text("UPDATE patients SET status = 'processing', progress = 25, updated_at = now() WHERE id = :id"),
        {"id": session_id},
    )
    await db.commit()
    logger.info("[session %d] stop_recording: received audio file '%s'", session_id, audio_file.filename)

    audio_bytes = await audio_file.read()
    logger.info("[session %d] stop_recording: audio read (%d bytes) — starting transcription", session_id, len(audio_bytes))

    try:
        transcript = transcribe_audio(audio_bytes, filename=audio_file.filename or "audio.m4a")
        logger.info("[session %d] stop_recording: transcription complete (%d chars)", session_id, len(transcript))
        logger.debug("[session %d] transcript: %s", session_id, transcript)
    except Exception as e:
        logger.error("[session %d] stop_recording: transcription failed — %s", session_id, e)
        _session_state[session_id] = {"status": "error", "progress": 0}
        await db.execute(
            text("UPDATE patients SET status = 'error', progress = 0, updated_at = now() WHERE id = :id"),
            {"id": session_id},
        )
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")

    # Persist transcript immediately so it survives restarts and tab changes.
    await db.execute(
        text("UPDATE patients SET transcript = :transcript, status = 'processing', progress = 75, updated_at = now() WHERE id = :id"),
        {"id": session_id, "transcript": transcript},
    )
    await db.commit()

    _session_state[session_id] = {"status": "processing", "progress": 75, "transcript": transcript}
    logger.info("[session %d] stop_recording: starting RAG pipeline", session_id)

    try:
        result = await compiled_graph.ainvoke({"transcript": transcript})
        logger.info("[session %d] stop_recording: RAG pipeline complete", session_id)
    except Exception as e:
        logger.error("[session %d] stop_recording: RAG pipeline failed — %s", session_id, e)
        _session_state[session_id] = {"status": "error", "progress": 0}
        await db.execute(
            text("UPDATE patients SET status = 'error', progress = 0, updated_at = now() WHERE id = :id"),
            {"id": session_id},
        )
        await db.commit()
        raise HTTPException(status_code=500, detail=f"RAG pipeline failed: {e}")

    _session_state[session_id] = {"status": "complete", "progress": 100, "transcript": transcript}
    await db.execute(
        text("UPDATE patients SET status = 'complete', progress = 100, updated_at = now() WHERE id = :id"),
        {"id": session_id},
    )
    await db.commit()

    return {
        "id": session_id,
        "status": "complete",
        "progress": 100,
        "transcript": transcript,
        "form": result["extracted_form"],
    }


@router.post("/{session_id}/process")
async def process_session(session_id: int, db: AsyncSession = Depends(get_db)):
    await _fetch_patient(session_id, db)
    _session_state[session_id] = {"status": "ready", "progress": 100}
    await db.execute(
        text("UPDATE patients SET status = 'ready', progress = 100, updated_at = now() WHERE id = :id"),
        {"id": session_id},
    )
    await db.commit()
    return {"id": session_id, "status": "ready", "progress": 100}


@router.get("/{session_id}/status")
async def get_status(session_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("SELECT status, progress FROM patients WHERE id = :id"),
        {"id": session_id},
    )
    row = result.mappings().one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found")
    # In-memory state takes priority (accurate during active processing).
    mem = _session_state.get(session_id, {})
    return {
        "id": session_id,
        "status": mem.get("status") or row["status"],
        "progress": mem.get("progress") or row["progress"],
    }


@router.get("/{session_id}/transcript")
async def get_transcript(session_id: int, db: AsyncSession = Depends(get_db)):
    # First check in-memory (active session).
    mem = _session_state.get(session_id, {})
    if mem.get("transcript"):
        return {"id": session_id, "transcript": mem["transcript"]}

    # Fall back to DB (persisted transcript).
    result = await db.execute(
        text("SELECT transcript FROM patients WHERE id = :id"),
        {"id": session_id},
    )
    row = result.mappings().one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"id": session_id, "transcript": row["transcript"] or ""}


@router.get("/{session_id}/form", response_model=PatientOut)
async def get_form(session_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            SELECT id, nurse, patient_info, background, current_assessment, vital_signs, medications
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
        vital_signs=row["vital_signs"],
        medications=row["medications"] or [],
    )


@router.put("/{session_id}/form", response_model=PatientOut)
async def update_form(
    session_id: int,
    payload: PatientCreate,
    db: AsyncSession = Depends(get_db),
):
    medications_data = [m.model_dump() for m in payload.medications] if payload.medications else []
    result = await db.execute(
        text("""
            UPDATE patients
            SET nurse              = CAST(:nurse AS JSONB),
                patient_info       = CAST(:patient_info AS JSONB),
                background         = CAST(:background AS JSONB),
                current_assessment = CAST(:current_assessment AS JSONB),
                vital_signs        = CAST(:vital_signs AS JSONB),
                medications        = CAST(:medications AS JSONB),
                updated_at         = now()
            WHERE id = :id
            RETURNING id, nurse, patient_info, background, current_assessment, vital_signs, medications
        """),
        {
            "id": session_id,
            "nurse": json.dumps(payload.nurse.model_dump()),
            "patient_info": json.dumps(payload.patient_info.model_dump()),
            "background": json.dumps(payload.background.model_dump()),
            "current_assessment": json.dumps(payload.current_assessment.model_dump()),
            "vital_signs": json.dumps(payload.vital_signs.model_dump()),
            "medications": json.dumps(medications_data),
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
        vital_signs=row["vital_signs"],
        medications=row["medications"] or [],
    )


@router.post("/{session_id}/finalize")
async def finalize_session(session_id: int, db: AsyncSession = Depends(get_db)):
    await _fetch_patient(session_id, db)
    _session_state[session_id] = {
        **_session_state.get(session_id, {}),
        "status": "final",
        "progress": 100,
    }
    await db.execute(
        text("UPDATE patients SET status = 'final', progress = 100, updated_at = now() WHERE id = :id"),
        {"id": session_id},
    )
    await db.commit()
    return {"id": session_id, "status": "final"}
