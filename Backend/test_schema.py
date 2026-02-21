print("Starting test_schema.py")

from app.schemas.patient import PatientCreate

payload = {
    "patient_info": {
        "name": "John Doe",
        "age": 42,
        "allergies": ["penicillin"],
        "code_status": "Full",
        "reason_for_admission": "Shortness of breath",
        "attending_service": "Internal Medicine",
    },
    "background": {
        "past_medical_history": ["HTN", "T2DM"],
        "hospital_day": 2,
        "procedures": ["CXR"],
        "baseline": "Independent at home",
    },
    "current_assessment": {
        "latest_vitals": {"hr_bpm": 92, "rr_bpm": 18, "spo2_percent": 95},
        "oxygen_support": {"device": "NC", "flow_l_min": 2, "fio2": 0.28},
        "pain_level_0_10": 3,
        "notes": "Stable, improving",
    },
}

obj = PatientCreate.model_validate(payload)
print("Schema OK")
print(obj.model_dump())