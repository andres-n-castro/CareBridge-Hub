export interface TranscriptSegment {
  id: string;
  speaker: 'Nurse' | 'Patient';
  timestamp: string;
  text: string;
  isPinned: boolean;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  source: 'AI' | 'User';
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  rationale: string;
  status: 'new' | 'asked' | 'answered';
  answer?: string;
  relatedFieldIds?: string[]; // IDs of fields this question might answer
}

export interface SVIMetric {
  label: string;
  score: string;
  category: 'Low' | 'Moderate' | 'High';
}

export type FieldStatus = 'missing' | 'uncertain' | 'filled' | 'confirmed';

export interface FieldMetadata<T> {
  value: T;
  status: FieldStatus;
  confidence?: number; // 0-1
  evidenceIds?: string[]; // IDs of transcript segments
  suggestedValue?: T;
  isRequired?: boolean; // For logic
}

export interface IntakeForm {
  [key: string]: FieldMetadata<any> | any; // Index signature for dynamic access
  // Patient Information
  patientName: FieldMetadata<string>;
  dob: FieldMetadata<string>;
  room: FieldMetadata<string>;
  allergies: FieldMetadata<string>;
  codeStatus: FieldMetadata<string>;
  reasonForAdmission: FieldMetadata<string>;
  geoLocation: FieldMetadata<string>;
  // Background
  relevantPMH: FieldMetadata<string>;
  hospitalDay: FieldMetadata<string>;
  procedures: FieldMetadata<string>;
  // Vital Signs
  temp: FieldMetadata<string>;
  heartRate: FieldMetadata<string>;
  respiratoryRate: FieldMetadata<string>;
  bpSystolic: FieldMetadata<string>;
  bpDiastolic: FieldMetadata<string>;
  // Current Assessment
  painLevel: FieldMetadata<string>;
  additionalInfo: FieldMetadata<string>;
  // Medications
  medications: FieldMetadata<Medication[]>;
  // Nurses on Shift
  nurseName: FieldMetadata<string>;
}

export type ReviewStatus = 'ready' | 'approved' | 'processing' | 'failed';