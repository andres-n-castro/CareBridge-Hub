from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class Medication(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    dose: str
    frequency: str
    source: str = "User"


class PatientInfo(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1)
    DOB: int = Field(ge=0, le=130)
    room_num: int = Field(ge=0)
    allergies: str = Field(default="None")
    code_status: str = Field(default="Full")
    reason_for_admission: Optional[str] = None
    geo_location: Optional[str] = None


class Background(BaseModel):
    model_config = ConfigDict(extra="forbid")

    past_medical_history: Optional[List[str]] = None
    hospital_day: Optional[int] = Field(default=None, ge=0)
    procedures: Optional[List[str]] = None


class VitalSigns(BaseModel):
    model_config = ConfigDict(extra="forbid")

    temp_c: Optional[float] = None
    hr_bpm: Optional[int] = None
    rr_bpm: Optional[int] = None
    bp_sys: Optional[int] = None
    bp_dia: Optional[int] = None


class CurrentAssessment(BaseModel):
    model_config = ConfigDict(extra="forbid")

    pain_level_0_10: Optional[int] = Field(default=None, ge=0, le=10)
    additional_info: Optional[str] = None


class Nurse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1)


class PatientCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nurse: Nurse
    patient_info: PatientInfo
    background: Background
    current_assessment: CurrentAssessment
    vital_signs: VitalSigns = Field(default_factory=VitalSigns)
    medications: Optional[List[Medication]] = None


class PatientOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int
    nurse: Nurse
    patient_info: PatientInfo
    background: Background
    current_assessment: CurrentAssessment
    vital_signs: VitalSigns
    medications: Optional[List[Medication]] = None
