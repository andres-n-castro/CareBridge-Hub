export type HandoffStatus = "needs_review" | "approved" | "failed";

export interface HandoffForm {
  id: string;
  patientId: string;
  roomNumber: string;
  createdAt: string; // ISO string
  status: HandoffStatus;
  attention: {
    missing: number;
    uncertain: number;
    followUps: number;
  };
  lastUpdated: string; // ISO string
}
