import { TranscriptSegment } from "../types";
import { cn } from "../../../components/ui/utils";
import { PlayCircle } from "lucide-react";

interface EvidenceSnippetProps {
  segment: TranscriptSegment;
  highlightText?: string;
  onClick?: () => void;
  onHover?: (isHovering: boolean) => void;
}

export function EvidenceSnippet({ segment, highlightText, onClick, onHover }: EvidenceSnippetProps) {
  return (
    <div 
      className="p-3 rounded border border-border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors text-sm group"
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={cn(
          "text-xs font-semibold px-1.5 py-0.5 rounded",
          segment.speaker === 'Nurse' ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
        )}>
          {segment.speaker}
        </span>
        <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
          {segment.timestamp}
          <PlayCircle className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </span>
      </div>
      <p className="text-foreground leading-relaxed">
        {segment.text}
      </p>
    </div>
  );
}
