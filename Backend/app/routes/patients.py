import json
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db import get_db
from app.schemas.patient import PatientCreate, PatientOut

router = APIRouter(prefix="/api/v1/patients", tags=["patients"])

@router.post("", response_model=PatientOut)
async def create_patient(payload: PatientCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            INSERT INTO patients (nurse, patient_info, background, current_assessment)
            VALUES (CAST(:nurse AS JSONB), CAST(:patient_info AS JSONB), CAST(:background AS JSONB), CAST(:current_assessment AS JSONB))
            RETURNING id, nurse, patient_info, background, current_assessment
        """),
        {
            "nurse": json.dumps(payload.nurse.model_dump()),
            "patient_info": json.dumps(payload.patient_info.model_dump()),
            "background": json.dumps(payload.background.model_dump()),
            "current_assessment": json.dumps(payload.current_assessment.model_dump()),
        },
    )
    row = result.mappings().one()
    await db.commit()

    return PatientOut(
        id=int(row["id"]),
        nurse=row["nurse"],
        patient_info=row["patient_info"],
        background=row["background"],
        current_assessment=row["current_assessment"],
    )
