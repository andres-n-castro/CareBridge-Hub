import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import {
  ArrowLeft,
  Printer,
  Download,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { TopNav } from "../../components/TopNav";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { TranscriptPanel } from "./components/TranscriptPanel";
import { FormPanel } from "./components/FormPanel";
import { SVIPanel } from "./components/SVIPanel";
import { StickyActionBar } from "./components/StickyActionBar";
import {
  TranscriptSegment,
  IntakeForm,
  SVIMetric,
  FollowUpQuestion,
  ReviewStatus,
  FieldMetadata,
} from "./types";
import { toast } from "sonner";
import * as api from "../../services/api";

export default function ReviewDashboardPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  // ── Loading / error state ──────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);

  // ── Page data ──────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<ReviewStatus>('ready');
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [formData, setFormData] = useState<IntakeForm | null>(null);
  const [sviMetrics, setSviMetrics] = useState<SVIMetric[]>([]);
  const [questions, setQuestions] = useState<FollowUpQuestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [focusedSegmentIds, setFocusedSegmentIds] = useState<string[]>([]);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  // ── Load data on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    const numericId = Number(sessionId);

    const load = async () => {
      try {
        // 1. Transcript — sessionStorage set by ProcessingPage; fall back to DB.
        let segments: TranscriptSegment[] = [];
        const cachedTranscript = sessionStorage.getItem(`transcript-${sessionId}`);
        if (cachedTranscript) {
          segments = api.plainTextToSegments(cachedTranscript);
        } else {
          try {
            const { transcript: dbText } = await api.getTranscript(numericId);
            if (dbText) {
              segments = api.plainTextToSegments(dbText);
              // Repopulate sessionStorage so subsequent loads are faster.
              sessionStorage.setItem(`transcript-${sessionId}`, dbText);
            }
          } catch {
            // Transcript not yet available — panel stays empty.
          }
        }
        setTranscript(segments);

        // 2. Form — prefer sessionStorage (raw RAG output), fall back to GET /form.
        let intakeForm;
        const cachedForm = sessionStorage.getItem(`form-${sessionId}`);
        if (cachedForm) {
          try {
            const parsed = JSON.parse(cachedForm) as Record<string, unknown>;
            intakeForm = api.rawExtractedFormToIntakeForm(parsed);
          } catch {
            // Malformed JSON in sessionStorage — fall back to DB.
            const patientOut = await api.getForm(numericId);
            intakeForm = api.patientOutToIntakeForm(patientOut);
          }
        } else {
          const patientOut = await api.getForm(numericId);
          intakeForm = api.patientOutToIntakeForm(patientOut);
        }

        // Assign transcript evidence IDs to form fields via keyword matching.
        if (segments.length > 0) {
          intakeForm = api.assignEvidenceIds(intakeForm, segments);
        }
        setFormData(intakeForm);

        // 3. SVI — always from the API (may return empty if transcript not ready).
        try {
          const sviData = await api.getSVI(numericId);
          if (sviData.metrics.length > 0) setSviMetrics(sviData.metrics);
          if (sviData.questions.length > 0) setQuestions(sviData.questions);
        } catch {
          // SVI unavailable — panel stays empty.
        }
      } catch (err) {
        toast.error('Failed to load session data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [sessionId]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const requiredFieldsComplete = formData
    ? Boolean(
        (formData.patientName as FieldMetadata<any>).status !== 'missing' &&
        (formData.reasonForAdmission as FieldMetadata<any>).status !== 'missing' &&
        (formData.relevantPMH as FieldMetadata<any>).status !== 'missing'
      )
    : false;

  const followUpsAddressed = questions.every((q) => q.status !== 'new');

  // ── Handlers (UI only — these keep the exact same signatures) ─────────────
  const handlePinSegment = (id: string) => {
    setTranscript((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
    );
    toast.success("Evidence updated");
  };

  const handleCopySegment = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.info("Copied to clipboard");
  };

  const handleFormChange = (newData: IntakeForm) => {
    setFormData(newData);
    setHasUnsavedChanges(true);
  };

  const handleQuestionChange = (
    id: string,
    qStatus: 'new' | 'asked' | 'answered',
    answer?: string
  ) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: qStatus, answer } : q))
    );
    setHasUnsavedChanges(true);
  };

  const handleSuggestionClick = (fieldId: string, suggestedValue?: string) => {
    if (suggestedValue && formData) {
      const meta = formData[fieldId] as FieldMetadata<any>;
      if (meta) {
        setFormData({ ...formData, [fieldId]: { ...meta, suggestedValue } });
      }
    }
    setActiveFieldId(fieldId);
  };

  const handleSegmentHover = (id: string, isHovering: boolean) => {
    setFocusedSegmentIds(isHovering ? [id] : []);
  };

  // ── API-backed handlers ────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!formData || !sessionId) return;
    setIsSaving(true);
    try {
      await api.updateForm(
        Number(sessionId),
        api.intakeFormToPatientCreate(formData)
      );
      // DB is now the source of truth — clear the raw RAG cache
      sessionStorage.removeItem(`form-${sessionId}`);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      toast.success("Draft saved successfully");
    } catch {
      toast.error("Save failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to discard all changes?")) return;
    if (!sessionId) return;
    const cachedForm = sessionStorage.getItem(`form-${sessionId}`);
    try {
      if (cachedForm) {
        setFormData(api.rawExtractedFormToIntakeForm(JSON.parse(cachedForm)));
      } else {
        const patientOut = await api.getForm(Number(sessionId));
        setFormData(api.patientOutToIntakeForm(patientOut));
      }
      setHasUnsavedChanges(false);
      toast.info("Changes discarded");
    } catch {
      toast.error("Failed to reset form.");
    }
  };

  const handleApprove = async () => {
    if (!sessionId) return;
    try {
      await api.finalizeSession(Number(sessionId));
      setStatus('approved');
      toast.success("Session approved and exported to EHR");
    } catch {
      toast.error("Approval failed. Please try again.");
    }
  };

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
        <TopNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Loading session data…</p>
          </div>
        </main>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      <TopNav />

      {/* Page Content */}
      <main className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">

        {/* Header Section */}
        <div className="px-6 py-4 border-b border-border bg-background flex-shrink-0">
          <div className="flex flex-col gap-4 max-w-[1400px] mx-auto w-full">
            {/* Breadcrumb */}
            <Link to="/sessions" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Sessions
            </Link>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Review Intake</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground border-l border-border pl-4">
                  <span className="font-medium text-foreground">
                    {sessionId ? `S-${sessionId}` : '—'}
                  </span>
                  <span>•</span>
                  <span>{sessionId ? `PT-•••${sessionId.slice(-4)}` : '—'}</span>
                  <span>•</span>
                  <span>Radiology</span>
                </div>
                <Badge
                  variant={status === 'approved' ? 'default' : 'secondary'}
                  className={status === 'approved' ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {status === 'approved' ? "Approved" : "Ready for Review"}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                 <div className="text-xs text-muted-foreground mr-2 text-right">
                    {hasUnsavedChanges ? (
                      <span className="text-orange-600 font-medium">Unsaved changes</span>
                    ) : lastSaved ? (
                      <span>Last saved: {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    ) : null}
                 </div>
                 <Button variant="outline" size="sm" className="h-8 gap-2" disabled={status !== 'approved'}>
                   <Download className="w-3.5 h-3.5" />
                   Export
                 </Button>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                   <Printer className="w-4 h-4" />
                 </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Global Alerts */}
        {!requiredFieldsComplete && (
           <div className="bg-orange-50 border-b border-orange-100 px-6 py-2 flex-shrink-0">
             <div className="max-w-[1400px] mx-auto w-full flex items-center gap-2 text-orange-800 text-sm">
               <AlertTriangle className="w-4 h-4" />
               <span className="font-medium">Action Required:</span>
               <span>Please complete all required fields marked with * before approving.</span>
             </div>
           </div>
        )}

        {/* 3-Column Grid */}
        <div className="flex-1 overflow-hidden bg-muted/20">
          <div className="h-full max-w-[1400px] mx-auto w-full p-6 grid grid-cols-12 gap-6">

            {/* Left: Transcript (30%) -> 4 cols */}
            <div className="col-span-12 lg:col-span-4 xl:col-span-4 h-full min-h-0">
              <TranscriptPanel
                segments={transcript}
                onPin={handlePinSegment}
                onCopy={handleCopySegment}
                highlightedSegmentIds={focusedSegmentIds}
                className="h-full"
              />
            </div>

            {/* Center: Form (40%) -> 5 cols */}
            <div className="col-span-12 lg:col-span-4 xl:col-span-5 h-full min-h-0">
               {formData && (
                 <FormPanel
                   data={formData}
                   transcript={transcript}
                   onChange={handleFormChange}
                   activeFieldId={activeFieldId}
                   onActiveFieldChange={setActiveFieldId}
                   onFocusSegment={(id) => setFocusedSegmentIds([id])}
                   className="h-full"
                 />
               )}
            </div>

            {/* Right: SVI (30%) -> 3 cols */}
            <div className="col-span-12 lg:col-span-4 xl:col-span-3 h-full min-h-0">
               <SVIPanel
                 metrics={sviMetrics}
                 questions={questions}
                 onQuestionChange={handleQuestionChange}
                 onSuggestionClick={handleSuggestionClick}
                 className="h-full"
               />
            </div>

          </div>
        </div>

        {/* Sticky Action Bar */}
        <StickyActionBar
           onSaveDraft={handleSaveDraft}
           onReset={handleReset}
           onApprove={handleApprove}
           isSaving={isSaving}
           canReset={hasUnsavedChanges}
           checks={{
             requiredFields: requiredFieldsComplete,
             followUps: followUpsAddressed
           }}
           className="border-t bg-background"
        />

      </main>
    </div>
  );
}
