import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "../../components/ui/dropdown-menu";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";

// Local Components
import { RecordingHeroCard } from "./RecordingHeroCard";
import { StopConfirmModal } from "./StopConfirmModal";
import { PermissionPanel } from "./PermissionPanel";
import { SessionContextBar, SessionContext } from "./SessionContextBar";

// Suggested defaults (simulating values from a prior step or system)
const SUGGESTED_CONTEXT: SessionContext = {
  patientId: "PT-•••4821",
  unit: "Radiology",
  created: new Date().toISOString(),
};

export default function RecordingSessionPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  // UI State
  const [status, setStatus] = useState<"idle" | "recording" | "paused">("idle");
  const [permissionState, setPermissionState] = useState<"granted" | "denied" | "no_device" | "error">("granted");
  const [showStopModal, setShowStopModal] = useState(false);
  const [lowInputWarning, setLowInputWarning] = useState(false);
  const [sessionContext, setSessionContext] = useState<SessionContext>(SUGGESTED_CONTEXT);

  // MediaRecorder refs — no state needed, just refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup the mic stream when the component unmounts
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Handlers
  const handleStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.start(1000); // collect chunks every second
      setPermissionState("granted");
      setStatus("recording");
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") setPermissionState("denied");
        else if (err.name === "NotFoundError") setPermissionState("no_device");
        else setPermissionState("error");
      } else {
        setPermissionState("error");
      }
    }
  };

  const handlePause = () => {
    mediaRecorderRef.current?.pause();
    setStatus("paused");
  };

  const handleResume = () => {
    mediaRecorderRef.current?.resume();
    setStatus("recording");
  };

  const handleStopRequest = () => {
    setShowStopModal(true);
    // Pause recording while confirmation modal is open
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
    }
    setStatus("paused");
  };

  const handleConfirmStop = () => {
    setShowStopModal(false);
    setStatus("idle");

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      // No active recorder — navigate with no audio blob (processing page handles it)
      navigate(`/sessions/${sessionId}/processing`, { state: { audioBlob: null } });
      return;
    }

    // Stop the recorder; collect all chunks in onstop before navigating
    recorder.onstop = () => {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      // Stop mic tracks
      streamRef.current?.getTracks().forEach((t) => t.stop());
      navigate(`/sessions/${sessionId}/processing`, { state: { audioBlob } });
    };
    recorder.stop();
  };

  const handleCancelStop = () => {
    setShowStopModal(false);
    // Resume recording if it was paused for the modal
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setStatus("recording");
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        if (status === "recording") handlePause();
        else if (status === "paused") handleResume();
        else if (status === "idle") handleStart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, permissionState]);

  // Render Helpers
  const renderContent = () => {
    if (permissionState === "denied") {
      return <PermissionPanel type="denied" onRetry={() => setPermissionState("granted")} />;
    }
    if (permissionState === "no_device") {
      return <PermissionPanel type="no_device" onRetry={() => setPermissionState("granted")} onBack={() => navigate("/sessions")} />;
    }
    if (permissionState === "error") {
      return <PermissionPanel type="error" onRetry={() => setPermissionState("granted")} onBack={() => navigate("/sessions")} />;
    }

    return (
      <RecordingHeroCard
        status={status}
        onStatusChange={(newStatus) => {
          if (newStatus === "recording") handleStart();
          else if (newStatus === "paused") handlePause();
          else setStatus(newStatus);
        }}
        onStop={handleStopRequest}
        lowInputWarning={lowInputWarning}
      />
    );
  };

  return (
    <div className="min-h-screen bg-muted/5 flex flex-col font-sans text-slate-900">

      {/* Custom Top Nav for Recording Page */}
      <nav className="h-16 border-b border-border bg-background flex items-center justify-center px-6 sticky top-0 z-50">
        <div className="w-full max-w-[1200px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-lg tracking-tight">
              Shift Hero
            </span>
            <div className="h-6 w-px bg-slate-200" />

            {/* Breadcrumb Area */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/sessions" className="hover:text-primary transition-colors flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Sessions
              </Link>
              <ChevronRight className="h-4 w-4 opacity-50" />
              <span className="font-medium text-foreground bg-slate-100 px-2 py-0.5 rounded-full text-xs border border-slate-200">
                {sessionId ?? "New"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {/* Dev Controls (Hidden in production, useful for demo) */}
             <div className="hidden lg:flex items-center gap-1 mr-4">
                <Button variant="ghost" size="sm" onClick={() => setPermissionState("denied")} className="text-xs h-6">Deny Mic</Button>
                <Button variant="ghost" size="sm" onClick={() => setPermissionState("no_device")} className="text-xs h-6">No Mic</Button>
                <Button variant="ghost" size="sm" onClick={() => setLowInputWarning(!lowInputWarning)} className="text-xs h-6">Toggle Low Input</Button>
             </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="pl-2 pr-1 py-1 h-auto hover:bg-muted gap-2 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">NP</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:inline-block">N. Patel</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-8 flex flex-col items-center">

        {/* Session Context Header */}
        <div className="w-full max-w-4xl mb-8 space-y-2">
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Recording Intake</h1>
          </div>

          <SessionContextBar
            context={sessionContext}
            suggestions={SUGGESTED_CONTEXT}
            onChange={setSessionContext}
          />
        </div>

        {/* Primary Recording Panel */}
        <div className="w-full max-w-4xl mb-8">
           {renderContent()}
        </div>

        {/* Secondary Actions */}
        <div className="w-full max-w-2xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="session-notes" className="text-slate-700">Add note (optional)</Label>
            <Textarea
              id="session-notes"
              placeholder="Enter any context about this session..."
              className="resize-none bg-white min-h-[100px]"
            />
          </div>

          <div className="pt-4 border-t border-slate-200">
             {/* Collapsible Settings (Progressive Disclosure) */}
             <details className="group">
               <summary className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-slate-900 w-fit select-none">
                 <Settings className="h-4 w-4" />
                 <span>Audio settings</span>
                 <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
               </summary>
               <div className="mt-3 pl-6 space-y-3">
                 <div className="space-y-1">
                   <Label className="text-xs text-muted-foreground">Input Device</Label>
                   <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 max-w-xs">
                     <option>Default - MacBook Pro Microphone</option>
                     <option>External USB Microphone</option>
                   </select>
                 </div>
               </div>
             </details>
          </div>

          <div className="flex justify-center pt-8">
            <Button variant="link" className="text-muted-foreground text-sm hover:text-destructive transition-colors" onClick={() => navigate("/sessions")}>
              Cancel session
            </Button>
          </div>
        </div>

      </main>

      <StopConfirmModal
        open={showStopModal}
        onOpenChange={setShowStopModal}
        onConfirm={handleConfirmStop}
        onCancel={handleCancelStop}
      />
    </div>
  );
}
