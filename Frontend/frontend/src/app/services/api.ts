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
  Medication,
} from '../pages/review/types';
import { HandoffForm, HandoffStatus } from '../types/handoff';

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
  geo_location: string | null;
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
  medications: Medication[] | null;
}

export interface PatientCreate {
  nurse: Nurse;
  patient_info: PatientInfo;
  background: Background;
  current_assessment: CurrentAssessment;
  vital_signs: VitalSigns;
  medications: Medication[] | null;
}

interface BackendSessionRow {
  id: number;
  name: string | null;
  room_num: number | null;
  created_at: string;
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

/** Fetch the persisted transcript for a session (DB-backed). */
export async function getTranscript(
  sessionId: number,
): Promise<{ id: number; transcript: string }> {
  return request<{ id: number; transcript: string }>(
    `/sessions/${sessionId}/transcript`,
  );
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
    ready: 'Ready',
    final: 'Approved',
    error: 'Failed',
  };
  return map[status] ?? 'Processing';
}

/** Map a backend session row to the frontend Session type. */
export function backendSessionToFrontend(row: BackendSessionRow): Session {
  const id = String(row.id);
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

function backendStatusToHandoffStatus(status: string): HandoffStatus {
  if (status === 'final') return 'approved';
  if (status === 'error') return 'failed';
  return 'needs_review';
}

/** Map a backend session row to the HandoffForm type used by HandoffFormsPage. */
export function backendSessionToHandoffForm(row: BackendSessionRow): HandoffForm {
  const id = String(row.id);
  const name = row.name && row.name !== 'Unknown' ? row.name : null;
  return {
    id,
    patientId: name ?? `PT-•••${id.slice(-4)}`,
    roomNumber: row.room_num != null ? String(row.room_num) : '—',
    createdAt: row.created_at ?? row.updated_at,
    status: backendStatusToHandoffStatus(row.status),
    // Per-field attention stats are not available in the list endpoint.
    // They would require loading each form individually — too expensive for a list.
    attention: { missing: 0, uncertain: 0, followUps: 0 },
    lastUpdated: row.updated_at,
  };
}

// ---- Form mapping ----------------------------------------------------------

/**
 * Create a FieldMetadata wrapper.
 * AI-extracted fields should pass confidence=0.85 and isAiSource=true to get
 * the 'uncertain' status that prompts nurses to verify them.
 */
function makeField<T>(
  value: T,
  required = false,
  confidence?: number,
  isAiSource = false,
): FieldMetadata<T> {
  const isEmpty =
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);

  const status = isEmpty
    ? 'missing'
    : isAiSource
    ? 'uncertain'
    : 'filled';

  const meta: FieldMetadata<T> = {
    value: (isEmpty ? (Array.isArray(value) ? [] : '') : value) as T,
    status,
    isRequired: required,
  };
  if (confidence !== undefined && !isEmpty) {
    meta.confidence = confidence;
  }
  return meta;
}

/** Compute age in years from an ISO date string (e.g. "1980-05-15"). */
function dobToAge(dob: string | null | undefined): string {
  if (!dob) return '';
  const year = new Date(dob).getFullYear();
  if (isNaN(year)) return '';
  const age = new Date().getFullYear() - year;
  return age > 0 && age < 130 ? String(age) : '';
}

/** Convert Fahrenheit to Celsius, rounded to 1 decimal place. */
function fToC(f: number | null | undefined): string {
  if (f == null) return '';
  return ((f - 32) * 5 / 9).toFixed(1);
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
    // Backend stores age as integer; display directly as numeric string.
    dob: makeField(pi.DOB != null && pi.DOB !== 0 ? String(pi.DOB) : '', true),
    room: makeField(pi.room_num != null && pi.room_num !== 0 ? String(pi.room_num) : '', true),
    allergies: makeField(pi.allergies && pi.allergies !== 'None' ? pi.allergies : '', true),
    codeStatus: makeField(pi.code_status && pi.code_status !== 'Full' ? pi.code_status : '', true),
    reasonForAdmission: makeField(pi.reason_for_admission ?? '', true),
    geoLocation: makeField(pi.geo_location ?? '', false),
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
    medications: makeField(data.medications ?? [], false),
    nurseName: makeField(nu.name && nu.name !== 'Unknown' ? nu.name : '', true),
  };
}

/**
 * Map the raw extracted_form dict returned by the RAG pipeline (stop endpoint)
 * to IntakeForm.
 *
 * The LLM schema (schema.json) produces a different key structure from the
 * Pydantic PatientOut schema, so we map explicitly here:
 *
 *   LLM key                      → IntakeForm field
 *   patient_information.name     → patientName
 *   patient_information.dob      → dob  (ISO date → age in years)
 *   patient_information.room     → room
 *   patient_information.allergies → allergies
 *   patient_information.code_status → codeStatus
 *   patient_information.reason_for_admission → reasonForAdmission
 *   patient_information.geolocation → geoLocation
 *   background.relevant_pmh      → relevantPMH
 *   background.hospital_day      → hospitalDay
 *   background.procedures        → procedures
 *   vital_signs.temperature_f    → temp  (°F → °C conversion)
 *   vital_signs.heart_rate       → heartRate
 *   vital_signs.respiratory_rate → respiratoryRate
 *   vital_signs.bp_systolic      → bpSystolic
 *   vital_signs.bp_diastolic     → bpDiastolic
 *   current_assessment.*         → painLevel, additionalInfo
 *   nurse_on_shift               → nurseName
 *
 * AI-extracted fields are marked 'uncertain' with confidence=0.85 so nurses
 * are prompted to verify them before approving.
 */
export function rawExtractedFormToIntakeForm(rawForm: Record<string, unknown>): IntakeForm {
  const pi = (rawForm.patient_information as Record<string, any>) ?? {};
  const bg = (rawForm.background as Record<string, any>) ?? {};
  const vs = (rawForm.vital_signs as Record<string, any>) ?? {};
  const ca = (rawForm.current_assessment as Record<string, any>) ?? {};
  const nurseOnShift = typeof rawForm.nurse_on_shift === 'string' ? rawForm.nurse_on_shift : '';

  const ai = <T>(value: T, required = false) => makeField(value, required, 0.85, true);

  return {
    patientName: ai(pi.name ?? '', true),
    // LLM returns ISO date; compute age in years.
    dob: ai(dobToAge(pi.dob), true),
    room: ai(pi.room != null ? String(pi.room) : '', true),
    allergies: ai(pi.allergies ?? '', true),
    codeStatus: ai(pi.code_status ?? '', true),
    reasonForAdmission: ai(pi.reason_for_admission ?? '', true),
    geoLocation: ai(pi.geolocation ?? '', false),
    relevantPMH: ai(
      pi.relevant_pmh ?? (bg.relevant_pmh != null ? String(bg.relevant_pmh) : ''),
      true,
    ),
    hospitalDay: ai(bg.hospital_day != null ? String(bg.hospital_day) : '', false),
    procedures: ai(
      bg.procedures != null ? String(bg.procedures) : '',
      false,
    ),
    // LLM extracts temperature in °F; convert to °C for storage/display.
    temp: ai(fToC(vs.temperature_f), true),
    heartRate: ai(vs.heart_rate != null ? String(vs.heart_rate) : '', true),
    respiratoryRate: ai(vs.respiratory_rate != null ? String(vs.respiratory_rate) : '', true),
    bpSystolic: ai(vs.bp_systolic != null ? String(vs.bp_systolic) : '', true),
    bpDiastolic: ai(vs.bp_diastolic != null ? String(vs.bp_diastolic) : '', true),
    painLevel: ai(ca.pain_level_0_10 != null ? String(ca.pain_level_0_10) : '', true),
    additionalInfo: ai(ca.additional_info ?? '', false),
    medications: ai(
      ((rawForm.medications as Array<{ name: string; dose: string | null; frequency: string | null }> | null) ?? [])
        .filter((m) => m && m.name)
        .map((m, i) => ({
          id: `ai-med-${i}`,
          name: m.name ?? '',
          dose: m.dose ?? '',
          frequency: m.frequency ?? '',
          source: 'AI' as const,
        })),
      false,
    ),
    nurseName: ai(nurseOnShift, true),
  };
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

  // DOB: backend wants integer age. Input is a plain number string.
  const dob = parseIntOrNull(get<string>('dob')) ?? 0;

  const meds = (form.medications as FieldMetadata<Medication[]>)?.value ?? [];

  return {
    nurse: { name: get<string>('nurseName') || 'Unknown' },
    patient_info: {
      name: get<string>('patientName') || 'Unknown',
      DOB: dob,
      room_num: parseIntOrNull(get<string>('room')) ?? 0,
      allergies: get<string>('allergies') || 'None',
      code_status: get<string>('codeStatus') || 'Full',
      reason_for_admission: get<string>('reasonForAdmission') || null,
      geo_location: get<string>('geoLocation') || null,
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
    medications: meds.length > 0 ? meds : null,
  };
}

/**
 * Assign evidenceIds to each form field by keyword-matching against transcript
 * segments. Call this after both form data and transcript segments are loaded.
 */
export function assignEvidenceIds(
  form: IntakeForm,
  segments: TranscriptSegment[],
): IntakeForm {
  const FIELD_KEYWORDS: Record<string, string[]> = {
    patientName: ['patient', 'name', 'mr.', 'ms.', 'mrs.', 'dr.'],
    dob: ['born', 'birth', 'age', 'year old', 'year-old'],
    allergies: ['allerg', 'reaction', 'sensitive'],
    codeStatus: ['code', 'dnr', 'full code', 'resuscitation', 'dni'],
    reasonForAdmission: ['admit', 'chief complaint', 'presenting', 'came in for', 'reason'],
    geoLocation: ['zip', 'address', 'location', 'neighborhood', 'lives in'],
    relevantPMH: ['history', 'medical history', 'pmh', 'diagnosed', 'chronic', 'condition'],
    hospitalDay: ['hospital day', 'hd #', 'pod #', 'post-op day', 'day of hospital'],
    procedures: ['procedure', 'surgery', 'scan', 'ekg', 'ecg', 'lab', 'test performed'],
    temp: ['temperature', 'fever', 'temp', 'degree'],
    heartRate: ['heart rate', 'pulse', 'hr ', 'bpm', 'beats per'],
    respiratoryRate: ['respiratory', 'breathing', 'breath', 'rr '],
    bpSystolic: ['blood pressure', 'systolic', 'bp '],
    bpDiastolic: ['blood pressure', 'diastolic'],
    painLevel: ['pain', 'pain scale', 'hurts', 'ache', 'discomfort', 'pain level'],
    additionalInfo: ['additional', 'note', 'observe', 'monitor', 'assessment'],
    medications: ['medication', 'medicine', 'drug', 'mg', 'dose', 'prescribed', 'taking'],
    nurseName: ['nurse', 'shift', 'my name', 'i am', "i'm"],
  };

  const updated = { ...form };
  for (const [fieldId, keywords] of Object.entries(FIELD_KEYWORDS)) {
    if (!keywords.length) continue;
    const meta = form[fieldId] as FieldMetadata<any>;
    if (!meta || meta.status === 'missing') continue;

    const matchingIds = segments
      .filter((seg) =>
        keywords.some((kw) => seg.text.toLowerCase().includes(kw.toLowerCase()))
      )
      .map((seg) => seg.id);

    if (matchingIds.length > 0) {
      updated[fieldId] = { ...meta, evidenceIds: matchingIds };
    }
  }
  return updated;
}

/**
 * Convert a plain-text Whisper transcript into TranscriptSegment[].
 * Speaker labels alternate Nurse/Patient since Whisper returns no diarization.
 */
export function plainTextToSegments(text: string): TranscriptSegment[] {
  if (!text) return [];

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
