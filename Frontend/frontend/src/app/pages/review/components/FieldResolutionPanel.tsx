import { useState, useEffect, type ReactNode } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Badge } from "../../../components/ui/badge";
import { FieldMetadata, TranscriptSegment } from "../types";
import { Check, X, ArrowRight, SkipForward, AlertCircle, HelpCircle, Sparkles } from "lucide-react";
import { cn } from "../../../components/ui/utils";
import { EvidenceSnippet } from "./EvidenceSnippet";

interface FieldResolutionPanelProps {
  fieldId: string;
  fieldLabel: string;
  metadata: FieldMetadata<any>;
  evidenceSegments: TranscriptSegment[];
  onConfirm: (value: any) => void;
  onSkip: () => void;
  onClose: () => void;
  onHoverSegment?: (id: string, isHovering: boolean) => void;
  renderInput?: (value: any, onChange: (val: any) => void) => ReactNode;
  className?: string;
}

export function FieldResolutionPanel({ 
  fieldId, 
  fieldLabel, 
  metadata, 
  evidenceSegments, 
  onConfirm, 
  onSkip, 
  onClose,
  onHoverSegment,
  renderInput,
  className 
}: FieldResolutionPanelProps) {
  const [value, setValue] = useState(metadata.value || "");
  const [isEdited, setIsEdited] = useState(false);

  useEffect(() => {
    setValue(metadata.value || "");
    setIsEdited(false);
  }, [fieldId, metadata]);

  const handleAcceptSuggestion = () => {
    if (metadata.suggestedValue) {
      setValue(metadata.suggestedValue);
      setIsEdited(true);
    }
  };

  const handleConfirm = () => {
    onConfirm(value);
  };

  return (
    <div className={cn("w-[320px] bg-background border border-border shadow-lg rounded-lg overflow-hidden flex flex-col", className)}>
      {/* Header */}
      <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{fieldLabel}</span>
          {metadata.status === 'missing' && (
            <Badge variant="destructive" className="h-5 text-[10px] px-1.5">Missing</Badge>
          )}
          {metadata.status === 'uncertain' && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 h-5 text-[10px] px-1.5">Uncertain</Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 text-muted-foreground" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
        {/* Suggestion Section */}
        {metadata.suggestedValue && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-md p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-blue-800 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              AI Suggestion
              {metadata.confidence && (
                <span className="text-blue-600/80 font-normal ml-auto">
                  {Math.round(metadata.confidence * 100)}% confidence
                </span>
              )}
            </div>
            <p className="text-sm text-foreground bg-white border border-blue-100 p-2 rounded">
              {metadata.suggestedValue}
            </p>
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 h-7 text-xs"
              onClick={handleAcceptSuggestion}
            >
              Accept Suggestion
            </Button>
          </div>
        )}

        {/* Evidence Section */}
        {evidenceSegments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Evidence from Transcript</h4>
            <div className="space-y-2">
              {evidenceSegments.map(seg => (
                <EvidenceSnippet 
                  key={seg.id} 
                  segment={seg} 
                  onHover={(isHovering) => onHoverSegment?.(seg.id, isHovering)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Manual Entry */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">
            {metadata.suggestedValue ? "Confirm or edit value" : "Enter value"}
          </label>
          
          {renderInput ? (
            <div className="min-h-[80px]">
              {renderInput(value, (val) => {
                setValue(val);
                setIsEdited(true);
              })}
            </div>
          ) : (
            <Textarea 
              value={value} 
              onChange={(e) => {
                setValue(e.target.value);
                setIsEdited(true);
              }} 
              className="min-h-[80px] text-sm resize-none"
              placeholder="Type here..."
            />
          )}
          <p className="text-[10px] text-muted-foreground">
            Review the evidence above before confirming.
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground hover:text-foreground h-8">
          Skip for now
        </Button>
        <Button size="sm" onClick={handleConfirm} className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
          <Check className="w-3.5 h-3.5" />
          Confirm Value
        </Button>
      </div>
    </div>
  );
}
