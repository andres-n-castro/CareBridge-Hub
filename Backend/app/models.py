from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import BigInteger, Column, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB

class Base(DeclarativeBase):
    pass

class Patient(Base):
    __tablename__ = "patients"

    id = Column(BigInteger, primary_key=True)
    nurse = Column(JSONB, nullable=False)
    patient_info = Column(JSONB, nullable=False)
    background = Column(JSONB, nullable=False)
    current_assessment = Column(JSONB, nullable=False)
    vital_signs = Column(JSONB, nullable=False, server_default="{}")
    medications = Column(JSONB, nullable=False, server_default="[]")

    transcript = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, server_default="pending")
    progress = Column(Integer, nullable=False, server_default="0")

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
