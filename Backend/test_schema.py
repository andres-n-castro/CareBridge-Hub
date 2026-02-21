print("Starting test_schema.py")

from app.schemas.patient import PatientCreate

payload = {
    "patient_info": {
        "name": "John Doe",
        "DOB": 42,
        "room_num": 312,
        "allergies": "Penicillin",
        "code_status": "Full",
        "reason_for_admission": "Shortness of breath"
    },
    "background": {
        "past_medical_history": ["HTN", "T2DM"],
        "hospital_day": 2,
        "procedures": ["CXR"]
    },
    "current_assessment": {
        "pain_level_0_10": 3,
        "additional_info": "Stable, improving"
    }
}

obj = PatientCreate.model_validate(payload)

print("Schema OK")
print(obj.model_dump())