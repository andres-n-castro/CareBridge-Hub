import * as React from "react";
import { ChevronDown, AlertTriangle, Download, RefreshCcw } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Button } from "../../../components/ui/button";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ErrorDetailsProps {
  error?: {
    code: string;
    message: string;
    timestamp: string;
    step: string;
  };
  onRetry?: () => void;
}

export function ErrorDetailsDisclosure({ error, onRetry }: ErrorDetailsProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!error) return null;

  return (
    <div
      className="w-full space-y-2 border border-destructive/20 rounded-lg bg-destructive/5 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">Processing failed</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-9 p-0 hover:bg-destructive/10 text-destructive"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
          <span className="sr-only">Toggle</span>
        </Button>
      </div>

      {isOpen && (
        <div className="space-y-4 px-4 pb-4 animate-in fade-in slide-in-from-top-1">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Error Code</span>
              <span className="font-mono bg-background px-1.5 py-0.5 rounded border border-border text-foreground">{error.code}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Step</span>
              <span className="text-foreground font-medium">{error.step}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Message</span>
              <p className="text-foreground">{error.message}</p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Timestamp</span>
              <span className="text-muted-foreground">{error.timestamp}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-destructive/10">
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
              <RefreshCcw className="h-3.5 w-3.5" />
              Retry Processing
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground ml-auto">
              <Download className="h-3.5 w-3.5" />
              Download Log
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
