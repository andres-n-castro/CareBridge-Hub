import { ArrowRight, CheckCircle2, AlertTriangle, Loader2, WifiOff, UploadCloud, FileText, Search, ShieldCheck, LayoutDashboard } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Stepper, Step } from "./Stepper";
import { ProgressBar } from "./ProgressBar";
import { ErrorDetailsDisclosure } from "./ErrorDetailsDisclosure";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatusCardProps {
  status: 'uploading' | 'processing' | 'ready' | 'failed' | 'offline';
  steps: Step[];
  progress: number;
  error?: any;
  onRetry?: () => void;
  onContinue?: () => void;
  onBack?: () => void;
}

export function StatusCard({ 
  status, 
  steps, 
  progress, 
  error,
  onRetry, 
  onContinue, 
  onBack 
}: StatusCardProps) {
  
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading': return <UploadCloud className="w-8 h-8 text-primary animate-pulse" />;
      case 'processing': return <Loader2 className="w-8 h-8 text-primary animate-spin" />;
      case 'ready': return <CheckCircle2 className="w-8 h-8 text-green-500" />;
      case 'failed': return <AlertTriangle className="w-8 h-8 text-destructive" />;
      case 'offline': return <WifiOff className="w-8 h-8 text-muted-foreground" />;
    }
  };

  const getStatusLabel = () => {
    if (status === 'uploading') return "Uploading audio...";
    if (status === 'processing') return "Processing intake...";
    if (status === 'ready') return "Ready for review";
    if (status === 'failed') return "Processing failed";
    if (status === 'offline') return "Connection lost";
    return "Unknown status";
  };

  const getStatusDescription = () => {
    if (status === 'uploading') return "Please wait while we secure the audio file.";
    if (status === 'processing') return "Generating transcript and extracting clinical data.";
    if (status === 'ready') return "Session processing complete. You can now review the results.";
    if (status === 'failed') return "We encountered an issue processing this session.";
    if (status === 'offline') return "Please check your internet connection.";
    return "";
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden w-full max-w-3xl mx-auto">
      {/* Header Section */}
      <div className="p-8 pb-6 flex flex-col items-center text-center space-y-4">
        <div className="bg-primary/5 p-4 rounded-full ring-1 ring-primary/10">
          {getStatusIcon()}
        </div>
        
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {getStatusLabel()}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {getStatusDescription()}
          </p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-8 pb-8 space-y-8">
        {/* Stepper */}
        <div className="pt-2 pb-6">
           <Stepper steps={steps} />
        </div>

        {/* Progress Bar (Only for uploading/processing) */}
        {(status === 'uploading' || status === 'processing') && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{Math.round(progress)}% complete</span>
              <span>~30s remaining</span>
            </div>
            <ProgressBar progress={progress} isIndeterminate={status === 'processing' && progress === 0} />
            <p className="text-xs text-muted-foreground text-center pt-2">
              You can keep this tab open while you prepare for the next patient.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {status === 'ready' ? (
            <Button size="lg" className="w-full sm:w-auto min-w-[200px]" onClick={onContinue}>
              Open Review Dashboard
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          ) : status === 'failed' || status === 'offline' ? (
             <Button variant="default" size="lg" onClick={onRetry} className="w-full sm:w-auto min-w-[160px]">
              Retry Processing
            </Button>
          ) : (
             <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
              Return to Sessions
            </Button>
          )}
        </div>

        {/* Error Details */}
        {(status === 'failed' || error) && (
          <div className="pt-4 border-t border-border mt-6">
            <ErrorDetailsDisclosure error={error} onRetry={onRetry} />
          </div>
        )}
      </div>
    </div>
  );
}
