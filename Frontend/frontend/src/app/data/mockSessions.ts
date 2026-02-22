import { SessionStatus } from "../components/StatusBadge";

export interface Session {
  id: string;
  patientId: string;
  createdAt: string;
  status: SessionStatus;
  lastUpdated: string;
  owner: string;
  maskedPatientId: string;
}

export const mockSessions: Session[] = [
  {
    id: "S-10482",
    patientId: "PT-93821",
    maskedPatientId: "PT-•••4821",
    createdAt: "2023-10-25T14:30:00Z",
    status: "Recording",
    lastUpdated: "Just now",
    owner: "NP"
  },
  {
    id: "S-10481",
    patientId: "PT-82710",
    maskedPatientId: "PT-•••2710",
    createdAt: "2023-10-25T13:15:00Z",
    status: "Processing",
    lastUpdated: "5 min ago",
    owner: "NP"
  },
  {
    id: "S-10480",
    patientId: "PT-73629",
    maskedPatientId: "PT-•••3629",
    createdAt: "2023-10-25T11:45:00Z",
    status: "Ready",
    lastUpdated: "1h ago",
    owner: "JD"
  },
  {
    id: "S-10479",
    patientId: "PT-64538",
    maskedPatientId: "PT-•••4538",
    createdAt: "2023-10-24T16:20:00Z",
    status: "Approved",
    lastUpdated: "Yesterday",
    owner: "NP"
  },
  {
    id: "S-10478",
    patientId: "PT-55447",
    maskedPatientId: "PT-•••5447",
    createdAt: "2023-10-24T09:10:00Z",
    status: "Failed",
    lastUpdated: "Yesterday",
    owner: "mk"
  },
  {
    id: "S-10477",
    patientId: "PT-46356",
    maskedPatientId: "PT-•••6356",
    createdAt: "2023-10-23T15:30:00Z",
    status: "Approved",
    lastUpdated: "2 days ago",
    owner: "NP"
  },
  {
    id: "S-10476",
    patientId: "PT-37265",
    maskedPatientId: "PT-•••7265",
    createdAt: "2023-10-23T11:05:00Z",
    status: "Approved",
    lastUpdated: "2 days ago",
    owner: "JD"
  }
];
