import { ReactNode } from "react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { FieldMetadata } from "../types";
import { AlertCircle, HelpCircle, Check, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "../../../components/ui/utils";

interface FormFieldProps {
  label: string;
  metadata: FieldMetadata<any>;
  children: ReactNode;
  onResolve?: () => void;
  className?: string;
}

export function FormField({ label, metadata, children, onResolve, className }: FormFieldProps) {
  const isMissing = metadata.status === 'missing';
  const isUncertain = metadata.status === 'uncertain';
  const isFilled = metadata.status === 'filled';
  const isConfirmed = metadata.status === 'confirmed';

  return (
    <div className={cn("space-y-1.5 relative group", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", 
            isMissing && "text-destructive",
            isUncertain && "text-amber-700"
          )}>
            {label}
          </label>
          
          {isMissing && (
            <Badge variant="destructive" className="h-5 text-[10px] px-1.5 gap-1 cursor-pointer hover:bg-destructive/90" onClick={onResolve}>
              <AlertCircle className="w-3 h-3" />
              Missing
            </Badge>
          )}
          
          {isUncertain && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 h-5 text-[10px] px-1.5 gap-1 cursor-pointer" onClick={onResolve}>
              <HelpCircle className="w-3 h-3" />
              Uncertain
              {metadata.confidence && (
                <span className="opacity-75 font-normal ml-0.5">
                  {Math.round(metadata.confidence * 100)}%
                </span>
              )}
            </Badge>
          )}

          {isFilled && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 h-5 text-[10px] px-1.5 gap-1">
              <Sparkles className="w-3 h-3" />
              AI Filled
            </Badge>
          )}

          {isConfirmed && (
             <Check className="w-3.5 h-3.5 text-green-600" />
          )}
        </div>
        
        {(isMissing || isUncertain) && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onResolve}
          >
            Resolve
          </Button>
        )}
      </div>

      <div 
        className={cn(
          "relative transition-all duration-200 rounded-md",
          isMissing && "ring-2 ring-destructive/20 bg-destructive/5",
          isUncertain && "ring-2 ring-amber-500/20 bg-amber-50/30",
          isFilled && "ring-1 ring-blue-500/20 bg-blue-50/10",
          isConfirmed && "ring-1 ring-green-500/10"
        )}
      >
        {children}
        
        {/* Overlay trigger for resolution (optional interaction pattern) */}
        {(isMissing || isUncertain) && (
          <div 
            className="absolute inset-0 z-10 cursor-pointer bg-transparent"
            onClick={onResolve}
            title="Click to resolve issue"
          />
        )}
      </div>

      {/* Helper Text */}
      {isMissing && (
        <p className="text-[10px] text-destructive font-medium flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Required field not captured
        </p>
      )}
      {isUncertain && (
        <p className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
          <HelpCircle className="w-3 h-3" />
          Low confidence - please verify
        </p>
      )}
    </div>
  );
}
