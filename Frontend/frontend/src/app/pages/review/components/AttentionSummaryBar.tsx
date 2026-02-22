import { Button } from "../../../components/ui/button";
import { AlertTriangle, HelpCircle, MessageSquare, ArrowRight } from "lucide-react";
import { cn } from "../../../components/ui/utils";

interface AttentionSummaryProps {
  missing: number;
  uncertain: number;
  followUps: number;
  onResolveNext: () => void;
  className?: string;
}

export function AttentionSummaryBar({ missing, uncertain, followUps, onResolveNext, className }: AttentionSummaryProps) {
  const hasIssues = missing > 0 || uncertain > 0 || followUps > 0;
  if (!hasIssues) return null;

  return (
    <div className={cn("sticky top-0 z-30 bg-amber-50/90 backdrop-blur-sm border-b border-amber-200 px-4 py-3 flex items-center justify-between shadow-sm transition-all", className)}>
      <div className="flex items-center gap-4 flex-wrap">
        {missing > 0 && (
          <div className="flex items-center gap-1.5 text-amber-800 text-sm font-medium bg-amber-100/50 px-2 py-0.5 rounded-full border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Missing: {missing}</span>
          </div>
        )}
        {uncertain > 0 && (
          <div className="flex items-center gap-1.5 text-orange-800 text-sm font-medium bg-orange-100/50 px-2 py-0.5 rounded-full border border-orange-200">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Uncertain: {uncertain}</span>
          </div>
        )}
        {followUps > 0 && (
          <div className="flex items-center gap-1.5 text-blue-800 text-sm font-medium bg-blue-100/50 px-2 py-0.5 rounded-full border border-blue-200">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Follow-ups: {followUps}</span>
          </div>
        )}
      </div>

      <Button 
        size="sm" 
        onClick={onResolveNext} 
        className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-sm gap-1.5 h-8 text-xs font-semibold px-3"
      >
        Resolve next
        <ArrowRight className="w-3 h-3" />
      </Button>
    </div>
  );
}
