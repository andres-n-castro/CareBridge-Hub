import asyncio
import json
import logging
from datetime import date
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db import get_db
from app.schemas.patient import PatientCreate, PatientOut
from app.stt.transcriber import transcribe_audio
from app.RAG import compiled_graph
from app.routes.svi import SVI_AVAILABLE, extract_zip_from_text, zip_to_county, get_info_from_cdcsvi

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sessions", tags=["sessions"])


def _count_missing(pi: dict, bg: dict, vs: dict, ca: dict, nurse: dict) -> int:
    """Count required fields that are null/empty in the patient record."""
    missing = 0
    if not pi.get("name") or pi["name"] == "Unknown": missing += 1
    if not pi.get("DOB") or pi["DOB"] == 0: missing += 1
    if not pi.get("room_num") or pi["room_num"] == 0: missing += 1
    if not pi.get("allergies") or pi["allergies"] == "None": missing += 1
    if not pi.get("code_status"): missing += 1
    if not pi.get("reason_for_admission"): missing += 1
    if not bg.get("past_medical_history"): missing += 1
    if vs.get("temp_c") is None: missing += 1
    if vs.get("hr_bpm") is None: missing += 1
    if vs.get("rr_bpm") is None: missing += 1
    if vs.get("bp_sys") is None: missing += 1
    if vs.get("bp_dia") is None: missing += 1
    if ca.get("pain_level_0_10") is None: missing += 1
    if not nurse.get("name") or nurse["name"] == "Unknown": missing += 1
    return missing


def _count_follow_ups(pi: dict) -> int:
    """Count SVI follow-up questions triggered by the patient's geo_location."""
    if not SVI_AVAILABLE or not get_info_from_cdcsvi:
        return 0
    geo = pi.get("geo_location")
    if not geo:
        return 0
    try:
        flags = get_info_from_cdcsvi(geo)
        if "error" in flags:
            return 0
        count = 0
        if flags.get("F_NOVEH", 0): count += 1
        if flags.get("F_LIMENG", 0): count += 1
        if int(flags.get("F_THEME1", 0)) >= 2: count += 1
        if flags.get("F_CROWD", 0): count += 1
        if flags.get("F_GROUPQ", 0): count += 1
        return count
    except Exception:
        return 0


def _llm_form_to_db_parts(extracted_form: dict) -> dict:
    """Convert the LLM-extracted form (schema.json shape) to DB JSONB column values."""
    pi = extracted_form.get("patient_information") or {}
    bg = extracted_form.get("background") or {}
    vs = extracted_form.get("vital_signs") or {}
    ca = extracted_form.get("current_assessment") or {}
    meds_raw = extracted_form.get("medications") or []

    # DOB ISO date → integer age
    dob_str = pi.get("dob") or ""
    age = 0
    if dob_str:
        try:
            birth_year = date.fromisoformat(dob_str).year
            age = date.today().year - birth_year
        except Exception:
            pass

    # Room: string → int
    room_str = pi.get("room") or ""
    try:
        room_num = int(room_str)
    except (ValueError, TypeError):
        room_num = 0

    # Temperature °F → °C
    temp_f = vs.get("temperature_f")
    temp_c = round((temp_f - 32) * 5 / 9, 1) if temp_f is not None else None

    # PMH: string or list → list or null
    pmh = bg.get("relevant_pmh")
    if isinstance(pmh, str) and pmh:
        pmh_list = [pmh]
    elif isinstance(pmh, list) and pmh:
        pmh_list = pmh
    else:
        pmh_list = None

    # Procedures: string or list → list or null
    proc = bg.get("procedures")
    if isinstance(proc, str) and proc:
        proc_list = [proc]
    elif isinstance(proc, list) and proc:
        proc_list = proc
    else:
        proc_list = None

    # Medications
    db_meds = []
    if isinstance(meds_raw, list):
        for i, med in enumerate(meds_raw):
            if isinstance(med, dict) and med.get("name"):
                db_meds.append({
                    "id": f"ai-med-{i}",
                    "name": med.get("name", ""),
                    "dose": med.get("dose") or "",
                    "frequency": med.get("frequency") or "",
                    "source": "AI",
                })

    nurse_name = extracted_form.get("nurse_on_shift") or "Unknown"

    return {
        "nurse": {"name": nurse_name},
        "patient_info": {
            "name": pi.get("name") or "Unknown",
            "DOB": age,
            "room_num": room_num,
            "allergies": pi.get("allergies") or "None",
            "code_status": pi.get("code_status") or "Full",
            "reason_for_admission": pi.get("reason_for_admission") or None,
            "geo_location": pi.get("geolocation") or None,
        },
        "background": {
            "past_medical_history": pmh_list,
            "hospital_day": bg.get("hospital_day"),
            "procedures": proc_list,
        },
        "vital_signs": {
            "temp_c": temp_c,
            "hr_bpm": vs.get("heart_rate"),
            "rr_bpm": vs.get("respiratory_rate"),
            "bp_sys": vs.get("bp_systolic"),
            "bp_dia": vs.get("bp_diastolic"),
        },
        "current_assessment": {
            "pain_level_0_10": ca.get("pain_level_0_10"),
            "additional_info": ca.get("additional_info") or None,
        },
        "medications": db_meds,
    }


@router.post("", status_code=201)
async def create_session(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            INSERT INTO patients (
                nurse, patient_info, background, current_assessment, vital_signs,
                medications, status, progress
            ) VALUES (
                CAST(:nurse AS JSONB),
                CAST(:patient_info AS JSONB),
                CAST(:background AS JSONB),
                CAST(:current_assessment AS JSONB),
                CAST(:vital_signs AS JSONB),
                CAST(:medications AS JSONB),
                'pending',
                0
            )
            RETURNING id
        """),
        {
            "nurse": '{"name":"Unknown"}',
            "patient_info": '{"name":"Unknown","DOB":0,"room_num":0,"allergies":"None","code_status":"Full","reason_for_admission":null,"geo_location":null}',
            "background": '{"past_medical_history":null,"hospital_day":null,"procedures":null}',
            "current_assessment": '{"pain_level_0_10":null,"additional_info":null}',
            "vital_signs": '{"temp_c":null,"hr_bpm":null,"rr_bpm":null,"bp_sys":null,"bp_dia":null}',
            "medications": '[]',
        },
    )
    row = result.mappings().one()
    await db.commit()
    return {"id": int(row["id"])}


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
                   created_at,
                   updated_at,
                   status,
                   progress,
                   patient_info,
                   background,
                   vital_signs,
                   current_assessment,
                   nurse
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
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "status": row["status"],
            "progress": row["progress"],
            "missing": _count_missing(
                row["patient_info"] or {},
                row["background"] or {},
                row["vital_signs"] or {},
                row["current_assessment"] or {},
                row["nurse"] or {},
            ),
            "uncertain": 0,
            "follow_ups": _count_follow_ups(row["patient_info"] or {}),
        }
        for row in rows
    ]


@router.post("/{session_id}/start")
async def start_recording(session_id: int, db: AsyncSession = Depends(get_db)):
    await _fetch_patient(session_id, db)
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
    await db.execute(
        text("UPDATE patients SET status = 'processing', progress = 25, updated_at = now() WHERE id = :id"),
        {"id": session_id},
    )
    await db.commit()
    logger.info("[session %d] stop_recording: received audio file '%s'", session_id, audio_file.filename)

    audio_bytes = await audio_file.read()
    logger.info("[session %d] stop_recording: audio read (%d bytes) — starting transcription", session_id, len(audio_bytes))

    try:
        transcript = await asyncio.to_thread(transcribe_audio, audio_bytes, filename=audio_file.filename or "audio.m4a")
        logger.info("[session %d] stop_recording: transcription complete (%d chars)", session_id, len(transcript))
    except Exception as e:
        logger.error("[session %d] stop_recording: transcription failed — %s", session_id, e)
        await db.execute(
            text("UPDATE patients SET status = 'error', progress = 0, updated_at = now() WHERE id = :id"),
            {"id": session_id},
        )
        await db.commit()
        raise HTTPException(status_code=500, detail="Transcription failed")

    await db.execute(
        text("UPDATE patients SET transcript = :transcript, status = 'processing', progress = 75, updated_at = now() WHERE id = :id"),
        {"id": session_id, "transcript": transcript},
    )
    await db.commit()
    logger.info("[session %d] stop_recording: starting RAG pipeline", session_id)

    try:
        result = await compiled_graph.ainvoke({"transcript": transcript})
        logger.info("[session %d] stop_recording: RAG pipeline complete", session_id)
    except Exception as e:
        logger.error("[session %d] stop_recording: RAG pipeline failed — %s", session_id, e)
        await db.execute(
            text("UPDATE patients SET status = 'error', progress = 0, updated_at = now() WHERE id = :id"),
            {"id": session_id},
        )
        await db.commit()
        raise HTTPException(status_code=500, detail="Processing failed")

    await db.execute(
        text("UPDATE patients SET status = 'complete', progress = 100, updated_at = now() WHERE id = :id"),
        {"id": session_id},
    )
    await db.commit()

    # Persist the extracted form fields to DB so GET /form returns them immediately.
    extracted_form = result["extracted_form"]
    try:
        db_parts = _llm_form_to_db_parts(extracted_form)
        await db.execute(
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
            """),
            {
                "id": session_id,
                "nurse": json.dumps(db_parts["nurse"]),
                "patient_info": json.dumps(db_parts["patient_info"]),
                "background": json.dumps(db_parts["background"]),
                "current_assessment": json.dumps(db_parts["current_assessment"]),
                "vital_signs": json.dumps(db_parts["vital_signs"]),
                "medications": json.dumps(db_parts["medications"]),
            },
        )
        await db.commit()
        logger.info("[session %d] stop_recording: extracted form saved to DB", session_id)
    except Exception as e:
        logger.warning("[session %d] stop_recording: failed to save extracted form to DB: %s", session_id, e)

    # Resolve ZIP code from transcript → county/state and write to geo_location.
    geo_location: str | None = None
    if SVI_AVAILABLE and extract_zip_from_text and zip_to_county:
        try:
            zip_code = extract_zip_from_text(transcript)
            if zip_code:
                county_info = await asyncio.to_thread(zip_to_county, zip_code)
                if county_info and county_info.get("county_name") and county_info.get("state_name"):
                    geo_location = f'{county_info["county_name"]}, {county_info["state_name"]}'
                    # Inject into extracted_form so the frontend sessionStorage gets it.
                    pi = extracted_form.get("patient_information")
                    if isinstance(pi, dict):
                        pi["geolocation"] = geo_location
                    # Persist to DB so future GET /form calls also return it.
                    await db.execute(
                        text("""
                            UPDATE patients
                            SET patient_info = jsonb_set(patient_info, '{geo_location}', :geo::jsonb),
                                updated_at = now()
                            WHERE id = :id
                        """),
                        {"id": session_id, "geo": json.dumps(geo_location)},
                    )
                    await db.commit()
                    logger.info("[session %d] geo_location set to: %s", session_id, geo_location)
        except Exception as e:
            logger.warning("[session %d] geo_location lookup failed: %s", session_id, e)

    return {
        "id": session_id,
        "status": "complete",
        "progress": 100,
        "transcript": transcript,
        "form": extracted_form,
    }


@router.post("/{session_id}/process")
async def process_session(session_id: int, db: AsyncSession = Depends(get_db)):
    await _fetch_patient(session_id, db)
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
    return {
        "id": session_id,
        "status": row["status"],
        "progress": row["progress"],
    }


@router.get("/{session_id}/transcript")
async def get_transcript(session_id: int, db: AsyncSession = Depends(get_db)):
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
    await db.execute(
        text("UPDATE patients SET status = 'final', progress = 100, updated_at = now() WHERE id = :id"),
        {"id": session_id},
    )
    await db.commit()
    return {"id": session_id, "status": "final"}


@router.delete("/{session_id}", status_code=204)
async def delete_session(session_id: int, db: AsyncSession = Depends(get_db)):
    await _fetch_patient(session_id, db)
    await db.execute(text("DELETE FROM patients WHERE id = :id"), {"id": session_id})
    await db.commit()
