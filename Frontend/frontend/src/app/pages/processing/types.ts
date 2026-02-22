export type ProcessingState = 
  | 'uploading'
  | 'transcribing'
  | 'analyzing'
  | 'verifying'
  | 'ready'
  | 'failed_upload'
  | 'failed_processing'
  | 'offline';

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'failed';
}

export const PROCESSING_STEPS = [
  { id: 'upload', label: 'Upload audio' },
  { id: 'transcribe', label: 'Transcribe' },
  { id: 'analyze', label: 'Analyze' },
  { id: 'verify', label: 'Verify' },
  { id: 'prepare', label: 'Prepare dashboard' },
] as const;
