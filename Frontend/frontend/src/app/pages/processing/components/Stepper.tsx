import { Check, X, Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type StepState = 'pending' | 'active' | 'complete' | 'failed';

export interface Step {
  id: string;
  label: string;
  state: StepState;
}

interface StepperProps {
  steps: Step[];
  className?: string;
}

export function Stepper({ steps, className }: StepperProps) {
  const activeIndex = steps.findIndex(s => s.state === 'active' || s.state === 'failed');
  const allComplete = steps.every(s => s.state === 'complete');
  
  const currentStepIndex = allComplete ? steps.length - 1 : (activeIndex === -1 ? 0 : activeIndex);

  // Grid approach:
  // Each item is centered in its column.
  // Column width = 100% / N.
  // Center of first item = 100% / 2N.
  // Center of last item = 100% - (100% / 2N).
  // Distance between centers = 100% / N.
  // Total line length available = (N-1) * (100% / N).
  // Current line length = CurrentIndex * (100% / N).
  // Line start offset = 100% / 2N.
  
  const colWidthPct = 100 / steps.length;
  const startOffset = colWidthPct / 2;
  const progressWidth = currentStepIndex * colWidthPct;
  const totalLineWidth = (steps.length - 1) * colWidthPct;

  return (
    <div className={cn("w-full relative", className)}>
      {/* Background Line */}
      <div 
        className="absolute top-[15px] h-[2px] bg-border -z-10" 
        style={{
          left: `${startOffset}%`,
          width: `${totalLineWidth}%`
        }}
      />
      
      {/* Progress Line */}
      <div 
        className="absolute top-[15px] h-[2px] bg-primary -z-10 transition-all duration-500 ease-in-out"
        style={{ 
          left: `${startOffset}%`,
          width: `${progressWidth}%` 
        }}
      />

      <div 
        className="grid w-full"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step) => {
          const isCompleted = step.state === 'complete';
          const isActive = step.state === 'active';
          const isFailed = step.state === 'failed';
          const isPending = step.state === 'pending';
          
          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 px-1">
              <div 
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 bg-background",
                  isPending && "border-border text-muted-foreground",
                  isActive && "border-primary text-primary ring-4 ring-primary/10 scale-110",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isFailed && "border-destructive bg-destructive text-destructive-foreground"
                )}
              >
                {isCompleted && <Check className="w-4 h-4" />}
                {isFailed && <X className="w-4 h-4" />}
                {isActive && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending && <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />}
              </div>
              
              <span className={cn(
                "mt-2 text-xs font-medium text-center transition-colors duration-300 w-full break-words",
                isActive ? "text-primary font-semibold" : 
                isFailed ? "text-destructive" :
                isCompleted ? "text-foreground" :
                "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
