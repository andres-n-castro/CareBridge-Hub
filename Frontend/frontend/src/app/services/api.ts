/**
 * api.ts — Central API service for CareBridge-Hub frontend.
 *
 * All HTTP calls to the FastAPI backend live here.
 * All data-mapping utilities (backend schema ↔ frontend types) also live here.
 */

import { Session } from '../data/mockSessions';
import { SessionStatus } from '../components/StatusBadge';
import {
  IntakeForm,
  TranscriptSegment,
  SVIMetric,
  FollowUpQuestion,
  FieldMetadata,
} from '../pages/review/types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Backend types (mirror of Pydantic schemas)
// ---------------------------------------------------------------------------

interface PatientInfo {
  name: string;
  DOB: number;
  room_num: number;
  allergies: string;
  code_status: string;
  reason_for_admission: string | null;
}

interface Background {
  past_medical_history: string[] | null;
  hospital_day: number | null;
  procedures: string[] | null;
}

interface VitalSigns {
  temp_c: number | null;
  hr_bpm: number | null;
  rr_bpm: number | null;
  bp_sys: number | null;
  bp_dia: number | null;
}

interface CurrentAssessment {
  pain_level_0_10: number | null;
  additional_info: string | null;
}

interface Nurse {
  name: string;
}

export interface PatientOut {
  id: number;
  nurse: Nurse;
  patient_info: PatientInfo;
  background: Background;
  current_assessment: CurrentAssessment;
  vital_signs: VitalSigns;
}

export interface PatientCreate {
  nurse: Nurse;
  patient_info: PatientInfo;
  background: Background;
  current_assessment: CurrentAssessment;
  vital_signs: VitalSigns;
}

interface BackendSessionRow {
  id: number;
  name: string | null;
  room_num: number | null;
  updated_at: string;
  status: string;
  progress: number;
}

interface BackendStatus {
  id: number;
  status: string;
  progress: number;
}

export interface StopResponse {
  id: number;
  status: string;
  progress: number;
  transcript: string;
  form: Record<string, unknown>;
}

interface SVIResponse {
  metrics: SVIMetric[];
  questions: FollowUpQuestion[];
  error?: string;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${opts?.method ?? 'GET'} ${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

async function postForm<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type — browser sets it with the multipart boundary.
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API POST ${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** Create a new empty patient/session record. Returns the new integer ID. */
export async function createSession(): Promise<{ id: number }> {
  return request<{ id: number }>('/sessions', { method: 'POST' });
}

/** Fetch all sessions (paginated). */
export async function listSessions(
  limit = 100,
  offset = 0,
): Promise<BackendSessionRow[]> {
  return request<BackendSessionRow[]>(
    `/sessions?limit=${limit}&offset=${offset}`,
  );
}

/** Upload audio and trigger the transcription + RAG pipeline. */
export async function stopRecording(
  sessionId: number,
  audioBlob: Blob,
): Promise<StopResponse> {
  const formData = new FormData();
  // Backend expects the field named "audio_file".
  formData.append('audio_file', audioBlob, 'recording.webm');
  return postForm<StopResponse>(`/sessions/${sessionId}/stop`, formData);
}

/** Poll the current processing status and progress (0–100). */
export async function getSessionStatus(
  sessionId: number,
): Promise<BackendStatus> {
  return request<BackendStatus>(`/sessions/${sessionId}/status`);
}

/** Fetch the persisted patient form for a session. */
export async function getForm(sessionId: number): Promise<PatientOut> {
  return request<PatientOut>(`/sessions/${sessionId}/form`);
}

/** Save nurse edits to the patient form. */
export async function updateForm(
  sessionId: number,
  payload: PatientCreate,
): Promise<PatientOut> {
  return request<PatientOut>(`/sessions/${sessionId}/form`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/** Mark a session as finalized/approved. */
export async function finalizeSession(
  sessionId: number,
): Promise<{ id: number; status: string }> {
  return request(`/sessions/${sessionId}/finalize`, { method: 'POST' });
}

/** Fetch SVI metrics and follow-up questions for a session. */
export async function getSVI(sessionId: number): Promise<SVIResponse> {
  return request<SVIResponse>(`/sessions/${sessionId}/svi`);
}

// ---------------------------------------------------------------------------
// Data-mapping utilities
// ---------------------------------------------------------------------------

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function backendStatusToFrontend(status: string): SessionStatus {
  const map: Record<string, SessionStatus> = {
    pending: 'Processing',
    recording: 'Recording',
    processing: 'Processing',
    complete: 'Ready',
    final: 'Approved',
    error: 'Failed',
  };
  return map[status] ?? 'Processing';
}

/** Map a backend session row to the frontend Session type. */
export function backendSessionToFrontend(row: BackendSessionRow): Session {
  const id = String(row.id);
  // Pad to at least 5 chars for display; last 4 digits shown in masked form.
  const displayId = id.padStart(5, '0');
  return {
    id,
    patientId: `PT-${displayId}`,
    maskedPatientId: `PT-•••${id.slice(-4)}`,
    createdAt: row.updated_at,
    status: backendStatusToFrontend(row.status),
    lastUpdated: formatRelativeTime(row.updated_at),
    owner: '',
  };
}

// ---- Form mapping ----------------------------------------------------------

function makeField<T>(
  value: T,
  required = false,
): FieldMetadata<T> {
  const isEmpty =
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);
  return {
    value: (value ?? (Array.isArray(value) ? [] : '')) as T,
    status: isEmpty ? 'missing' : 'filled',
    isRequired: required,
  };
}

/** Map a PatientOut (from GET /sessions/{id}/form) to the UI IntakeForm. */
export function patientOutToIntakeForm(data: PatientOut): IntakeForm {
  const pi = data.patient_info ?? {};
  const bg = data.background ?? {};
  const vs = data.vital_signs ?? {};
  const ca = data.current_assessment ?? {};
  const nu = data.nurse ?? {};

  return {
    patientName: makeField(pi.name ?? '', true),
    // Backend stores DOB as age (integer). Display as "Age: N".
    dob: makeField(pi.DOB != null && pi.DOB !== 0 ? `Age: ${pi.DOB}` : '', true),
    room: makeField(pi.room_num != null && pi.room_num !== 0 ? String(pi.room_num) : '', true),
    allergies: makeField(pi.allergies && pi.allergies !== 'None' ? pi.allergies : '', true),
    codeStatus: makeField(pi.code_status && pi.code_status !== 'Full' ? pi.code_status : '', true),
    reasonForAdmission: makeField(pi.reason_for_admission ?? '', true),
    geoLocation: makeField('', false),
    relevantPMH: makeField((bg.past_medical_history ?? []).join(', '), true),
    hospitalDay: makeField(bg.hospital_day != null ? String(bg.hospital_day) : '', false),
    procedures: makeField((bg.procedures ?? []).join(', '), false),
    temp: makeField(vs.temp_c != null ? String(vs.temp_c) : '', true),
    heartRate: makeField(vs.hr_bpm != null ? String(vs.hr_bpm) : '', true),
    respiratoryRate: makeField(vs.rr_bpm != null ? String(vs.rr_bpm) : '', true),
    bpSystolic: makeField(vs.bp_sys != null ? String(vs.bp_sys) : '', true),
    bpDiastolic: makeField(vs.bp_dia != null ? String(vs.bp_dia) : '', true),
    painLevel: makeField(ca.pain_level_0_10 != null ? String(ca.pain_level_0_10) : '', true),
    additionalInfo: makeField(ca.additional_info ?? '', false),
    medications: makeField([], false),
    nurseName: makeField(nu.name && nu.name !== 'Unknown' ? nu.name : '', true),
  };
}

/**
 * Map the raw extracted_form dict returned by the RAG pipeline (stop endpoint)
 * to IntakeForm.  The LLM returns a PatientCreate-shaped object.
 */
export function rawExtractedFormToIntakeForm(rawForm: Record<string, unknown>): IntakeForm {
  const asPatientOut: PatientOut = {
    id: 0,
    nurse: (rawForm.nurse as Nurse) ?? { name: '' },
    patient_info: (rawForm.patient_info as PatientInfo) ?? {
      name: '',
      DOB: 0,
      room_num: 0,
      allergies: 'None',
      code_status: 'Full',
      reason_for_admission: null,
    },
    background: (rawForm.background as Background) ?? {
      past_medical_history: null,
      hospital_day: null,
      procedures: null,
    },
    current_assessment: (rawForm.current_assessment as CurrentAssessment) ?? {
      pain_level_0_10: null,
      additional_info: null,
    },
    vital_signs: (rawForm.vital_signs as VitalSigns) ?? {
      temp_c: null,
      hr_bpm: null,
      rr_bpm: null,
      bp_sys: null,
      bp_dia: null,
    },
  };
  return patientOutToIntakeForm(asPatientOut);
}

/** Map IntakeForm back to PatientCreate for PUT /sessions/{id}/form. */
export function intakeFormToPatientCreate(form: IntakeForm): PatientCreate {
  const parseIntOrNull = (v: string): number | null => {
    const n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  };
  const parseFloatOrNull = (v: string): number | null => {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };
  const splitList = (v: string): string[] | null =>
    v ? v.split(',').map((s) => s.trim()).filter(Boolean) : null;

  const get = <T>(field: string): T =>
    ((form[field] as FieldMetadata<T>)?.value ?? '') as T;

  // DOB: backend wants integer (age). Frontend stores "Age: N" or just a number.
  const dobRaw = get<string>('dob');
  const dobMatch = dobRaw.match(/^Age:\s*(\d+)$/);
  const dob = dobMatch ? parseInt(dobMatch[1], 10) : parseIntOrNull(dobRaw) ?? 0;

  return {
    nurse: { name: get<string>('nurseName') || 'Unknown' },
    patient_info: {
      name: get<string>('patientName') || 'Unknown',
      DOB: dob,
      room_num: parseIntOrNull(get<string>('room')) ?? 0,
      allergies: get<string>('allergies') || 'None',
      code_status: get<string>('codeStatus') || 'Full',
      reason_for_admission: get<string>('reasonForAdmission') || null,
    },
    background: {
      past_medical_history: splitList(get<string>('relevantPMH')),
      hospital_day: parseIntOrNull(get<string>('hospitalDay')),
      procedures: splitList(get<string>('procedures')),
    },
    current_assessment: {
      pain_level_0_10: parseIntOrNull(get<string>('painLevel')),
      additional_info: get<string>('additionalInfo') || null,
    },
    vital_signs: {
      temp_c: parseFloatOrNull(get<string>('temp')),
      hr_bpm: parseIntOrNull(get<string>('heartRate')),
      rr_bpm: parseIntOrNull(get<string>('respiratoryRate')),
      bp_sys: parseIntOrNull(get<string>('bpSystolic')),
      bp_dia: parseIntOrNull(get<string>('bpDiastolic')),
    },
  };
}

/**
 * Convert a plain-text Whisper transcript into TranscriptSegment[].
 * Speaker labels are an approximation (alternating Nurse/Patient) since
 * Whisper returns no diarization in this implementation.
 */
export function plainTextToSegments(text: string): TranscriptSegment[] {
  if (!text) return [];

  // Split on paragraph breaks first, then single newlines.
  const chunks = text
    .split(/\n{2,}/)
    .flatMap((block) => block.split(/\n/))
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  return chunks.map((segText, i) => ({
    id: `seg-${i}`,
    speaker: (i % 2 === 0 ? 'Nurse' : 'Patient') as 'Nurse' | 'Patient',
    timestamp: '—',
    text: segText,
    isPinned: false,
  }));
}
