import { useState, useMemo, type ReactNode } from "react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "../../../components/ui/accordion";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { AlertCircle, Trash2, Plus, Check, User, Activity, Clipboard, Stethoscope, Pill, Users } from "lucide-react";
import { cn } from "../../../components/ui/utils";
import { IntakeForm, Medication, TranscriptSegment, FieldMetadata } from "../types";
import { FormField } from "./FormField";
import { AttentionSummaryBar } from "./AttentionSummaryBar";
import { FieldResolutionPanel } from "./FieldResolutionPanel";
import { Popover, PopoverContent, PopoverAnchor } from "../../../components/ui/popover";

// All form fields in display order, grouped by section
const ALL_FIELDS = [
  // Patient Information
  'patientName', 'dob', 'room', 'allergies', 'codeStatus', 'reasonForAdmission', 'geoLocation',
  // Background
  'relevantPMH', 'hospitalDay', 'procedures',
  // Vital Signs
  'temp', 'heartRate', 'respiratoryRate', 'bpSystolic', 'bpDiastolic',
  // Current Assessment
  'painLevel', 'additionalInfo',
  // Medications
  'medications',
  // Nurses on Shift
  'nurseName',
];

const FIELD_LABELS: Record<string, string> = {
  patientName: 'Name',
  dob: 'Age (years)',
  room: 'Room',
  allergies: 'Allergies',
  codeStatus: 'Code Status',
  reasonForAdmission: 'Reason for Admission',
  geoLocation: 'Geo Location',
  relevantPMH: 'Relevant PMH (Past Medical History)',
  hospitalDay: 'Hospital Day / Post-Op Day',
  procedures: 'Procedures',
  temp: 'Temp (°C)',
  heartRate: 'Heart Rate',
  respiratoryRate: 'Respiratory Rate',
  bpSystolic: 'Blood Pressure (Systolic)',
  bpDiastolic: 'Blood Pressure (Diastolic)',
  painLevel: 'Pain Level (0–10)',
  additionalInfo: 'Additional Info',
  medications: 'Medications',
  nurseName: 'Name',
};

interface FormPanelProps {
  data: IntakeForm;
  transcript: TranscriptSegment[];
  onChange: (data: IntakeForm) => void;
  onSegmentHover?: (segmentId: string, isHovering: boolean) => void;
  onFocusSegment?: (segmentId: string) => void;
  activeFieldId?: string | null;
  onActiveFieldChange?: (fieldId: string | null) => void;
  className?: string;
}

export function FormPanel({ 
  data, 
  transcript, 
  onChange, 
  onSegmentHover,
  onFocusSegment, 
  activeFieldId, 
  onActiveFieldChange, 
  className 
}: FormPanelProps) {
  const [internalActiveFieldId, setInternalActiveFieldId] = useState<string | null>(null);
  
  const currentActiveFieldId = activeFieldId !== undefined ? activeFieldId : internalActiveFieldId;
  const setCurrentActiveFieldId = onActiveFieldChange || setInternalActiveFieldId;

  const handleFieldChange = (field: keyof IntakeForm, value: any) => {
    const currentMeta = data[field] as FieldMetadata<any>;
    if (!currentMeta || typeof currentMeta !== 'object' || !('status' in currentMeta)) return;
    const newStatus = currentMeta.status === 'missing' ? 'filled' : currentMeta.status;
    
    onChange({ 
      ...data, 
      [field]: { 
        ...currentMeta, 
        value,
        status: newStatus
      } 
    });
  };

  const handleConfirm = (field: keyof IntakeForm, value: any) => {
    const currentMeta = data[field] as FieldMetadata<any>;
    if (!currentMeta || typeof currentMeta !== 'object' || !('status' in currentMeta)) return;
    const newData = { 
      ...data, 
      [field]: { 
        ...currentMeta, 
        value,
        status: 'confirmed' as const
      } 
    };
    onChange(newData);
    handleResolveNext(newData);
  };

  const handleSkip = () => {
    handleResolveNext(data, currentActiveFieldId || undefined);
  };

  // Compute stats for AttentionSummaryBar
  const stats = useMemo(() => {
    let missing = 0;
    let uncertain = 0;
    let followUps = 0;

    ALL_FIELDS.forEach((key) => {
      const meta = data[key] as FieldMetadata<any>;
      if (meta && typeof meta === 'object' && 'status' in meta) {
        if (meta.status === 'missing') missing++;
        if (meta.status === 'uncertain') uncertain++;
      }
    });

    return { missing, uncertain, followUps };
  }, [data]);

  const handleResolveNext = (currentData: IntakeForm = data, startAfterFieldId?: string) => {
    let searchFields = ALL_FIELDS;
    if (startAfterFieldId) {
      const idx = ALL_FIELDS.indexOf(startAfterFieldId);
      if (idx !== -1) {
        const after = ALL_FIELDS.slice(idx + 1);
        const before = ALL_FIELDS.slice(0, idx + 1);
        searchFields = [...after, ...before];
      }
    }
    
    const getFieldMeta = (f: string): FieldMetadata<any> | undefined => {
      const meta = currentData[f];
      return meta && typeof meta === 'object' && 'status' in meta ? meta as FieldMetadata<any> : undefined;
    };

    const firstMissing = searchFields.find(f => getFieldMeta(f)?.status === 'missing');
    if (firstMissing) {
      setCurrentActiveFieldId(firstMissing);
      return;
    }

    const firstUncertain = searchFields.find(f => getFieldMeta(f)?.status === 'uncertain');
    if (firstUncertain) {
      setCurrentActiveFieldId(firstUncertain);
      return;
    }
    
    setCurrentActiveFieldId(null);
  };

  const getEvidence = (ids?: string[]) => {
    if (!ids) return [];
    return transcript.filter(t => ids.includes(t.id));
  };

  const getLabelForField = (field: string) => {
    return FIELD_LABELS[field] || field;
  };

  // Helper component to wrap FormField with Popover logic
  const FieldWrapper = ({ id, children }: { id: string, children: ReactNode }) => {
    const meta = data[id] as FieldMetadata<any>;
    if (!meta || typeof meta !== 'object' || !('status' in meta)) return null;
    const label = getLabelForField(id);
    const isOpen = currentActiveFieldId === id;

    const renderInput = id === 'medications' 
      ? (val: Medication[], setVal: (v: Medication[]) => void) => (
          <div className="border rounded-md overflow-hidden">
            <MedicationList medications={Array.isArray(val) ? val : []} onChange={setVal} />
          </div>
        )
      : undefined;

    return (
      <Popover open={isOpen} onOpenChange={(open) => !open && setCurrentActiveFieldId(null)}>
        <PopoverAnchor asChild>
           <div className="w-full">
             <FormField 
                label={label} 
                metadata={meta} 
                onResolve={() => setCurrentActiveFieldId(id)}
              >
                {children}
              </FormField>
           </div>
        </PopoverAnchor>
        <PopoverContent side="right" align="start" className={cn("p-0 border-none bg-transparent shadow-none ml-4", id === 'medications' ? "w-[400px]" : "w-[320px]")} onOpenAutoFocus={(e) => e.preventDefault()}>
           <FieldResolutionPanel 
             fieldId={id}
             fieldLabel={label}
             metadata={meta}
             evidenceSegments={getEvidence(meta.evidenceIds)}
             onConfirm={(val) => handleConfirm(id, val)}
             onSkip={handleSkip}
             onClose={() => setCurrentActiveFieldId(null)}
             onHoverSegment={onSegmentHover}
             renderInput={renderInput as any}
             className={id === 'medications' ? "w-[400px]" : undefined}
           />
        </PopoverContent>
      </Popover>
    );
  };

  // Count issues per section for section badges
  const countSectionIssues = (fieldIds: string[]) => {
    let missing = 0;
    let uncertain = 0;
    fieldIds.forEach(id => {
      const meta = data[id] as FieldMetadata<any>;
      if (meta && typeof meta === 'object' && 'status' in meta) {
        if (meta.status === 'missing') missing++;
        if (meta.status === 'uncertain') uncertain++;
      }
    });
    return { missing, uncertain };
  };

  const patientInfoFields = ['patientName', 'dob', 'room', 'allergies', 'codeStatus', 'reasonForAdmission', 'geoLocation'];
  const backgroundFields = ['relevantPMH', 'hospitalDay', 'procedures'];
  const vitalSignFields = ['temp', 'heartRate', 'respiratoryRate', 'bpSystolic', 'bpDiastolic'];
  const assessmentFields = ['painLevel', 'additionalInfo'];
  const nurseFields = ['nurseName'];

  const patientIssues = countSectionIssues(patientInfoFields);
  const backgroundIssues = countSectionIssues(backgroundFields);
  const vitalIssues = countSectionIssues(vitalSignFields);
  const assessmentIssues = countSectionIssues(assessmentFields);
  const medIssues = countSectionIssues(['medications']);
  const nurseIssues = countSectionIssues(nurseFields);

  const SectionIssueBadges = ({ issues }: { issues: { missing: number; uncertain: number } }) => (
    <span className="flex items-center gap-1.5 ml-auto">
      {issues.missing > 0 && (
        <Badge variant="destructive" className="h-5 text-[10px] px-1.5">{issues.missing} missing</Badge>
      )}
      {issues.uncertain > 0 && (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 h-5 text-[10px] px-1.5">{issues.uncertain} uncertain</Badge>
      )}
    </span>
  );

  return (
    <div className={cn("flex flex-col h-full border border-border rounded-lg bg-card overflow-hidden shadow-sm relative", className)}>
      {/* Sticky Attention Bar */}
      <AttentionSummaryBar 
        missing={stats.missing} 
        uncertain={stats.uncertain} 
        followUps={stats.followUps}
        onResolveNext={() => handleResolveNext()}
      />

      {/* Sticky Header (if no attention needed) */}
      {!stats.missing && !stats.uncertain && !stats.followUps && (
        <div className="p-4 border-b border-border bg-card z-10 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Intake Form</h2>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
            Mark all reviewed
          </Button>
        </div>
      )}

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto bg-muted/10 p-4 space-y-4">
        <Accordion type="multiple" defaultValue={["patientInfo", "background", "vitals", "assessment", "medications", "nurses"]} className="w-full space-y-4">
          
          {/* Patient Information */}
          <AccordionItem value="patientInfo" className="border border-border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 flex-1">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>Patient Information</span>
                <SectionIssueBadges issues={patientIssues} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <FieldWrapper id="patientName">
                    <Input 
                      value={data.patientName.value} 
                      onChange={(e) => handleFieldChange('patientName', e.target.value)}
                      placeholder="Full name"
                    />
                  </FieldWrapper>
                </div>
                <div>
                  <FieldWrapper id="dob">
                    <Input
                      type="number"
                      min={0}
                      max={130}
                      value={data.dob.value}
                      onChange={(e) => handleFieldChange('dob', e.target.value)}
                      placeholder="e.g. 42"
                    />
                  </FieldWrapper>
                </div>
                <div>
                  <FieldWrapper id="room">
                    <Input 
                      value={data.room.value} 
                      onChange={(e) => handleFieldChange('room', e.target.value)}
                      placeholder="e.g. 312-B"
                    />
                  </FieldWrapper>
                </div>
              </div>
              <div>
                <FieldWrapper id="allergies">
                  <Input 
                    value={data.allergies.value} 
                    onChange={(e) => handleFieldChange('allergies', e.target.value)}
                    placeholder="No known allergies"
                  />
                </FieldWrapper>
              </div>
              <div>
                <FieldWrapper id="codeStatus">
                  <Input 
                    value={data.codeStatus.value} 
                    onChange={(e) => handleFieldChange('codeStatus', e.target.value)}
                    placeholder="e.g. Full Code, DNR, DNI"
                  />
                </FieldWrapper>
              </div>
              <div>
                <FieldWrapper id="reasonForAdmission">
                  <Textarea 
                    value={data.reasonForAdmission.value} 
                    onChange={(e) => handleFieldChange('reasonForAdmission', e.target.value)}
                    className="min-h-[80px]"
                    placeholder="Reason for admission"
                  />
                </FieldWrapper>
              </div>
              <div>
                <FieldWrapper id="geoLocation">
                  <Input 
                    value={data.geoLocation.value} 
                    onChange={(e) => handleFieldChange('geoLocation', e.target.value)}
                    placeholder="Geo location"
                  />
                </FieldWrapper>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Background */}
          <AccordionItem value="background" className="border border-border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 flex-1">
                <Clipboard className="w-4 h-4 text-muted-foreground" />
                <span>Background</span>
                <SectionIssueBadges issues={backgroundIssues} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div>
                <FieldWrapper id="relevantPMH">
                  <Textarea 
                    value={data.relevantPMH.value} 
                    onChange={(e) => handleFieldChange('relevantPMH', e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Relevant past medical history..."
                  />
                </FieldWrapper>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldWrapper id="hospitalDay">
                    <Input 
                      value={data.hospitalDay.value} 
                      onChange={(e) => handleFieldChange('hospitalDay', e.target.value)}
                      placeholder="e.g. HD #3 / POD #1"
                    />
                  </FieldWrapper>
                </div>
                <div>
                  <FieldWrapper id="procedures">
                    <Input 
                      value={data.procedures.value} 
                      onChange={(e) => handleFieldChange('procedures', e.target.value)}
                      placeholder="Procedures performed"
                    />
                  </FieldWrapper>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Vital Signs */}
          <AccordionItem value="vitals" className="border border-border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 flex-1">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span>Vital Signs</span>
                <SectionIssueBadges issues={vitalIssues} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <FieldWrapper id="temp">
                    <Input 
                      value={data.temp.value} 
                      onChange={(e) => handleFieldChange('temp', e.target.value)}
                      placeholder="°C"
                    />
                  </FieldWrapper>
                </div>
                <div>
                  <FieldWrapper id="heartRate">
                    <Input 
                      value={data.heartRate.value} 
                      onChange={(e) => handleFieldChange('heartRate', e.target.value)}
                      placeholder="bpm"
                    />
                  </FieldWrapper>
                </div>
                <div>
                  <FieldWrapper id="respiratoryRate">
                    <Input 
                      value={data.respiratoryRate.value} 
                      onChange={(e) => handleFieldChange('respiratoryRate', e.target.value)}
                      placeholder="breaths/min"
                    />
                  </FieldWrapper>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldWrapper id="bpSystolic">
                    <Input 
                      value={data.bpSystolic.value} 
                      onChange={(e) => handleFieldChange('bpSystolic', e.target.value)}
                      placeholder="mmHg"
                    />
                  </FieldWrapper>
                </div>
                <div>
                  <FieldWrapper id="bpDiastolic">
                    <Input 
                      value={data.bpDiastolic.value} 
                      onChange={(e) => handleFieldChange('bpDiastolic', e.target.value)}
                      placeholder="mmHg"
                    />
                  </FieldWrapper>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Current Assessment */}
          <AccordionItem value="assessment" className="border border-border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 flex-1">
                <Stethoscope className="w-4 h-4 text-muted-foreground" />
                <span>Current Assessment</span>
                <SectionIssueBadges issues={assessmentIssues} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div>
                <FieldWrapper id="painLevel">
                  <Input 
                    value={data.painLevel.value} 
                    onChange={(e) => handleFieldChange('painLevel', e.target.value)}
                    placeholder="0–10"
                  />
                </FieldWrapper>
              </div>
              <div>
                <FieldWrapper id="additionalInfo">
                  <Textarea 
                    value={data.additionalInfo.value} 
                    onChange={(e) => handleFieldChange('additionalInfo', e.target.value)}
                    placeholder="Enter any additional clinical observations..."
                    className="min-h-[100px]"
                  />
                </FieldWrapper>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Medications */}
          <AccordionItem value="medications" className="border border-border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 flex-1">
                <Pill className="w-4 h-4 text-muted-foreground" />
                <span>Medications</span>
                <SectionIssueBadges issues={medIssues} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <FieldWrapper id="medications">
                <MedicationList 
                  medications={data.medications.value} 
                  onChange={(meds) => handleFieldChange('medications', meds)} 
                />
              </FieldWrapper>
            </AccordionContent>
          </AccordionItem>

          {/* Nurses on Shift */}
          <AccordionItem value="nurses" className="border border-border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 flex-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>Nurses on Shift</span>
                <SectionIssueBadges issues={nurseIssues} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div>
                <FieldWrapper id="nurseName">
                  <Input 
                    value={data.nurseName.value} 
                    onChange={(e) => handleFieldChange('nurseName', e.target.value)}
                    placeholder="Nurse name"
                  />
                </FieldWrapper>
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>
    </div>
  );
}

function MedicationList({ medications, onChange }: { medications: Medication[], onChange: (meds: Medication[]) => void }) {
  const updateMed = (id: string, field: keyof Medication, value: string) => {
    onChange(medications.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const removeMed = (id: string) => {
    onChange(medications.filter(m => m.id !== id));
  };

  const addMed = () => {
    onChange([...medications, { id: Math.random().toString(), name: "", dose: "", frequency: "", source: 'User' }]);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs font-medium text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Medication</th>
              <th className="px-3 py-2 w-24">Dose</th>
              <th className="px-3 py-2 w-32">Freq</th>
              <th className="px-3 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {medications.map((med) => (
              <tr key={med.id} className="group hover:bg-muted/5">
                <td className="p-2">
                  <Input 
                    value={med.name} 
                    onChange={(e) => updateMed(med.id, 'name', e.target.value)}
                    className="h-8 text-xs border-transparent hover:border-border focus:border-primary px-2"
                    placeholder="Name"
                  />
                </td>
                <td className="p-2">
                  <Input 
                    value={med.dose} 
                    onChange={(e) => updateMed(med.id, 'dose', e.target.value)}
                    className="h-8 text-xs border-transparent hover:border-border focus:border-primary px-2"
                    placeholder="Dose"
                  />
                </td>
                <td className="p-2">
                  <Input 
                    value={med.frequency} 
                    onChange={(e) => updateMed(med.id, 'frequency', e.target.value)}
                    className="h-8 text-xs border-transparent hover:border-border focus:border-primary px-2"
                    placeholder="Freq"
                  />
                </td>
                <td className="p-2 text-center">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeMed(med.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="outline" size="sm" className="w-full border-dashed gap-2 text-xs" onClick={addMed}>
        <Plus className="w-3.5 h-3.5" />
        Add Medication
      </Button>
    </div>
  );
}
