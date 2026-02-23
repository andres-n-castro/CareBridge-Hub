import importlib.util
import logging
import os

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sessions", tags=["svi"])

# ---------------------------------------------------------------------------
# Attempt to load cdcsvi_lookup from the "LLM Parse" folder at runtime.
# ---------------------------------------------------------------------------
_llm_parse_dir = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "LLM Parse")
)
_svi_lookup_path = os.path.join(_llm_parse_dir, "cdcsvi_lookup.py")

SVI_AVAILABLE = False
extract_zip_from_text = None
zip_to_county = None
get_info_from_cdcsvi = None

try:
    spec = importlib.util.spec_from_file_location("cdcsvi_lookup", _svi_lookup_path)
    if spec and spec.loader:
        _mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(_mod)  # type: ignore[union-attr]
        extract_zip_from_text = _mod.extract_zip_from_text
        zip_to_county = _mod.zip_to_county
        get_info_from_cdcsvi = _mod.get_info_from_cdcsvi
        SVI_AVAILABLE = True
        logger.info("SVI lookup loaded successfully from %s", _svi_lookup_path)
except Exception as exc:
    logger.warning(
        "SVI lookup unavailable (missing pandas/CSV or import error): %s", exc
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _flag_to_category(key: str, raw: int) -> str:
    """
    Convert a raw SVI flag value to a display category.
    F_THEME1 is a count (0–4), so we apply graduated thresholds.
    All other flags are binary (0 or 1).
    """
    if key == "F_THEME1":
        if raw == 0:
            return "Low"
        elif raw <= 2:
            return "Moderate"
        else:
            return "High"
    return "High" if raw else "Low"


def _svi_flags_to_metrics(flags: dict) -> list[dict]:
    label_map = [
        ("F_THEME1", "Socioeconomic"),
        ("F_LIMENG", "Language Access"),
        ("F_CROWD", "Housing Crowding"),
        ("F_NOVEH", "Transportation"),
        ("F_GROUPQ", "Group Quarters"),
    ]
    metrics = []
    for key, label in label_map:
        raw = int(flags.get(key, 0))
        # Normalize F_THEME1 score to 0.00–1.00 range; others are already 0/1.
        score = raw / 4.0 if key == "F_THEME1" else float(raw)
        category = _flag_to_category(key, raw)
        metrics.append({"label": label, "score": f"{score:.2f}", "category": category})
    return metrics


def _svi_flags_to_questions(flags: dict) -> list[dict]:
    questions = []
    if flags.get("F_NOVEH", 0):
        questions.append({
            "id": "q-noveh",
            "question": "Do you have reliable transportation to pick up prescriptions?",
            "rationale": "Patient's area shows vehicle access vulnerability.",
            "status": "new",
            "relatedFieldIds": ["geoLocation", "additionalInfo"],
        })
    if flags.get("F_LIMENG", 0):
        questions.append({
            "id": "q-limeng",
            "question": "Would you prefer to receive instructions in a language other than English?",
            "rationale": "Patient's area has limited English proficiency indicators.",
            "status": "new",
            "relatedFieldIds": ["additionalInfo"],
        })
    if int(flags.get("F_THEME1", 0)) >= 2:
        questions.append({
            "id": "q-socio",
            "question": "Do you have any concerns about affording medications or follow-up visits?",
            "rationale": "Patient's area shows socioeconomic vulnerability.",
            "status": "new",
            "relatedFieldIds": ["additionalInfo"],
        })
    if flags.get("F_CROWD", 0):
        questions.append({
            "id": "q-crowd",
            "question": "Will you have a quiet, clean space at home to recover?",
            "rationale": "Patient's area shows housing crowding indicators.",
            "status": "new",
            "relatedFieldIds": ["additionalInfo"],
        })
    if flags.get("F_GROUPQ", 0):
        questions.append({
            "id": "q-groupq",
            "question": "Can you describe your current living situation?",
            "rationale": "Patient's area has group quarters population indicators.",
            "status": "new",
            "relatedFieldIds": ["additionalInfo"],
        })
    return questions


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.get("/{session_id}/svi")
async def get_svi(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    location_override: str | None = Query(default=None, alias="location"),
):
    """
    Return Social Vulnerability Index metrics and follow-up questions for a
    session. Resolves location via three strategies in priority order:
      0. Use the ?location= query param if provided (zip code or 'County, State').
      1. Extract ZIP from transcript and resolve county/state via external APIs.
      2. Use geo_location already stored in patient_info (set by the regular
         recording flow or by a manual nurse edit).
    """
    if not SVI_AVAILABLE:
        logger.info("SVI lookup not available — returning empty response")
        return {"metrics": [], "questions": [], "error": "svi_unavailable"}

    location: str | None = None

    # Strategy 0: explicit location override from the caller (e.g. live form edit).
    if location_override:
        loc = location_override.strip()
        # If it looks like a bare ZIP code, resolve it to county/state first.
        if loc.isdigit() and len(loc) == 5:
            try:
                county_info = zip_to_county(loc)  # type: ignore[misc]
                if county_info and county_info.get("county_name") and county_info.get("state_name"):
                    location = f'{county_info["county_name"]}, {county_info["state_name"]}'
            except Exception as exc:
                logger.warning("SVI ZIP resolution failed for override '%s': %s", loc, exc)
        if not location and loc:
            # Treat as "County, State" or whatever format get_info_from_cdcsvi accepts.
            location = loc

    if not location:
        result = await db.execute(
            text("SELECT transcript, patient_info FROM patients WHERE id = :id"),
            {"id": session_id},
        )
        row = result.mappings().one_or_none()
        transcript: str | None = row["transcript"] if row else None
        patient_info: dict = (row["patient_info"] if row else None) or {}

        # Strategy 1: extract ZIP from transcript and resolve to county/state.
        if transcript:
            try:
                zip_code = extract_zip_from_text(transcript)  # type: ignore[misc]
                if zip_code:
                    county_info = zip_to_county(zip_code)  # type: ignore[misc]
                    if county_info and county_info.get("county_name") and county_info.get("state_name"):
                        location = f'{county_info["county_name"]}, {county_info["state_name"]}'
            except Exception as exc:
                logger.warning("SVI ZIP extraction failed for session %d: %s", session_id, exc)

        # Strategy 2: fall back to geo_location stored in patient_info.
        if not location:
            geo = patient_info.get("geo_location")
            if geo and isinstance(geo, str):
                location = geo
                logger.info("SVI using stored geo_location for session %d: %s", session_id, location)

    if not location:
        return {"metrics": [], "questions": [], "error": "no_location_found"}

    try:
        svi_flags = get_info_from_cdcsvi(location)  # type: ignore[misc]

        if "error" in svi_flags:
            return {"metrics": [], "questions": [], "error": svi_flags["error"]}

        return {
            "metrics": _svi_flags_to_metrics(svi_flags),
            "questions": _svi_flags_to_questions(svi_flags),
        }

    except Exception as exc:
        logger.error("SVI lookup failed for session %d: %s", session_id, exc)
        return {"metrics": [], "questions": [], "error": str(exc)}
