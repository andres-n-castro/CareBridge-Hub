import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { TopNav } from "../../components/TopNav";
import { StatusCard } from "./components/StatusCard";
import { StatusCardSkeleton } from "./components/StatusCardSkeleton";
import { Step } from "./components/Stepper";
import { ArrowLeft, User, Calendar } from "lucide-react";
import { Link } from "react-router";
import { Button } from "../../components/ui/button";
import * as api from "../../services/api";

const BASE_STEPS: Step[] = [
  { id: 'upload',     label: 'Upload audio',      state: 'pending' },
  { id: 'transcribe', label: 'Transcribe',         state: 'pending' },
  { id: 'analyze',    label: 'Analyze',            state: 'pending' },
  { id: 'verify',     label: 'Verify',             state: 'pending' },
  { id: 'prepare',    label: 'Prepare dashboard',  state: 'pending' },
];

type PageState = 'loading' | 'uploading' | 'processing' | 'ready' | 'failed' | 'offline';

/** Map backend progress (0–100) and status string to step states. */
function progressToSteps(progress: number, backendStatus: string): Step[] {
  if (backendStatus === 'error') {
    return BASE_STEPS.map((s, i) => ({
      ...s,
      state: i === 0 ? 'complete' : i === 1 ? 'failed' : 'pending',
    }));
  }
  if (progress >= 100) {
    return BASE_STEPS.map((s) => ({ ...s, state: 'complete' }));
  }
  if (progress >= 75) {
    return BASE_STEPS.map((s, i) => ({
      ...s,
      state: i < 2 ? 'complete' : i === 2 ? 'active' : 'pending',
    }));
  }
  if (progress >= 25) {
    return BASE_STEPS.map((s, i) => ({
      ...s,
      state: i < 1 ? 'complete' : i === 1 ? 'active' : 'pending',
    }));
  }
  return BASE_STEPS.map((s, i) => ({
    ...s,
    state: i === 0 ? 'active' : 'pending',
  }));
}

export default function ProcessingPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // audioBlob is passed via navigation state from RecordingSessionPage.
  // Capture it once — it won't change during the page's lifetime.
  const audioBlob: Blob | null = (location.state as any)?.audioBlob ?? null;

  const [pageStatus, setPageStatus] = useState<PageState>('loading');
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<Step[]>(BASE_STEPS);
  const [error, setError] = useState<any>(null);

  // Use a ref for the interval so the callback can always read the current ID.
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Guard against double-execution in React 18 Strict Mode.
  const ranRef = useRef(false);

  const stopPolling = () => {
    if (pollIntervalRef.current !== null) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (!sessionId) return;
    const numericId = Number(sessionId);
    // `hasBlob` is stable — it's based on navigation state that doesn't change.
    const hasBlob = Boolean(audioBlob);

    // ── Start polling for step-by-step visual progress ─────────────────────
    pollIntervalRef.current = setInterval(async () => {
      try {
        const { status: s, progress: p } = await api.getSessionStatus(numericId);
        setProgress(p);
        setSteps(progressToSteps(p, s));

        // Path B only (no audio blob): the interval drives the final transition.
        // Path A: the stop() promise handles the final transition.
        if (!hasBlob) {
          if (s === 'complete') {
            stopPolling();
            setSteps(BASE_STEPS.map((st) => ({ ...st, state: 'complete' })));
            setProgress(100);
            setPageStatus('ready');
          } else if (s === 'error') {
            stopPolling();
            setPageStatus('failed');
          }
        }
      } catch {
        // Network hiccup — keep polling
      }
    }, 2000);

    if (hasBlob) {
      // ── Path A: came from RecordingPage with an audio blob ───────────────
      setPageStatus('uploading');
      setSteps(progressToSteps(0, 'pending'));

      api
        .stopRecording(numericId, audioBlob!)
        .then((result) => {
          stopPolling();
          sessionStorage.setItem(`transcript-${sessionId}`, result.transcript ?? '');
          sessionStorage.setItem(`form-${sessionId}`, JSON.stringify(result.form ?? {}));
          setSteps(BASE_STEPS.map((s) => ({ ...s, state: 'complete' })));
          setProgress(100);
          setPageStatus('ready');
        })
        .catch((err: Error) => {
          stopPolling();
          setPageStatus('failed');
          setError({
            message: err.message,
            step: 'Upload / Processing',
            timestamp: new Date().toISOString(),
          });
        });
    } else {
      // ── Path B: direct navigation / refresh ─────────────────────────────
      setPageStatus('processing');
    }

    return stopPolling;
  }, []); // intentionally empty — run exactly once on mount

  // ── Manual override for dev/demo ─────────────────────────────────────────
  const setDemoState = (s: PageState) => {
    setPageStatus(s);
    setProgress(s === 'uploading' ? 0 : s === 'ready' ? 100 : 50);
    setError(null);
    if (s === 'ready') {
      setSteps(BASE_STEPS.map((step) => ({ ...step, state: 'complete' })));
    } else if (s === 'uploading') {
      setSteps(progressToSteps(0, 'pending'));
    } else if (s === 'failed') {
      setSteps(
        BASE_STEPS.map((step, i) => ({
          ...step,
          state: i === 1 ? 'failed' : i < 1 ? 'complete' : 'pending',
        }))
      );
      setError({
        code: 'ERR_UPLOAD_FAILED',
        message: 'Failed to upload audio file. Network connection interrupted.',
        timestamp: new Date().toLocaleTimeString(),
        step: 'Upload audio',
      });
    }
  };

  // Map pageStatus to StatusCard's narrower status prop
  const cardStatus: 'uploading' | 'processing' | 'ready' | 'failed' | 'offline' =
    pageStatus === 'loading' || pageStatus === 'uploading'
      ? 'uploading'
      : pageStatus === 'processing'
      ? 'processing'
      : pageStatus === 'ready'
      ? 'ready'
      : pageStatus === 'failed'
      ? 'failed'
      : 'offline';

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      <TopNav />

      <main className="flex-1 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Breadcrumb & Context Header */}
        <div className="w-full max-w-4xl mb-8 space-y-4">
          <Link
            to="/sessions"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Sessions
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Processing Intake
              </h1>
              <p className="text-muted-foreground mt-1">
                Audio is uploading and will be analyzed after the session ends.
              </p>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-lg border border-border/50">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {sessionId ? `S-${sessionId}` : '—'}
                </span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{sessionId ? `PT-•••${sessionId.slice(-4)}` : '—'}</span>
              </div>
              <div className="w-px h-4 bg-border hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Status Card */}
        <div className="w-full max-w-4xl">
          {pageStatus === 'loading' ? (
            <StatusCardSkeleton />
          ) : (
            <StatusCard
              status={cardStatus}
              steps={steps}
              progress={progress}
              error={error}
              onRetry={() => navigate(`/sessions/${sessionId}/record`)}
              onContinue={() => navigate(`/sessions/${sessionId}/review`)}
              onBack={() => navigate('/sessions')}
            />
          )}
        </div>

        {/* Dev Controls */}
        <div className="mt-12 p-4 border border-dashed border-border rounded-lg bg-muted/20 w-full max-w-4xl">
          <p className="text-xs font-mono text-muted-foreground mb-3 uppercase tracking-wider">
            Dev Controls: Force State
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setDemoState('uploading')}>
              Uploading
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPageStatus('processing')}>
              Processing
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDemoState('ready')}>
              Ready
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDemoState('failed')}>
              Failed
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPageStatus('offline')}>
              Offline
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
