import { Button } from "../../../components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "../../../components/ui/utils";
import { ApproveConfirmModal } from "./ApproveConfirmModal";
import { useState } from "react";

interface StickyActionBarProps {
  onSaveDraft: () => void;
  onReset: () => void;
  onApprove: () => void;
  isSaving: boolean;
  canReset: boolean;
  checks: {
    requiredFields: boolean;
    followUps: boolean;
  };
  className?: string;
}

export function StickyActionBar({ 
  onSaveDraft, 
  onReset, 
  onApprove, 
  isSaving, 
  canReset,
  checks, 
  className 
}: StickyActionBarProps) {
  const [showApproveModal, setShowApproveModal] = useState(false);

  // Approval is disabled if required fields are missing
  // Follow-ups are optional but recommended? 
  // Prompt says: "Disabled until required fields complete AND (optional) follow-ups reviewed"
  // Let's assume strict: required fields MUST be complete. Follow-ups warning but maybe not blocking?
  // Prompt: "Disabled until required fields complete AND (optional) follow-ups reviewed" -> Actually implies follow-ups reviewed IS required condition for enabled button.
  // But wait, "AND (optional) follow-ups reviewed". That phrasing is ambiguous.
  // Let's make it strict: Both required.
  
  const isApproveDisabled = !checks.requiredFields || !checks.followUps;

  return (
    <>
      <div className={cn(
        "sticky bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-t border-border px-6 py-4 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]",
        className
      )}>
        <div className="flex items-center gap-4">
          <Button 
            variant="secondary" 
            onClick={onSaveDraft} 
            disabled={isSaving}
            className="w-32"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Draft"
            )}
          </Button>
          
          {canReset && (
            <Button 
              variant="link" 
              onClick={onReset} 
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              Reset changes
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4">
           {isApproveDisabled && (
            <span className="text-xs text-muted-foreground hidden sm:inline-block text-right">
              {!checks.requiredFields 
                ? "Complete required fields to approve" 
                : "Address all follow-ups to approve"}
            </span>
          )}
          <Button 
            onClick={() => setShowApproveModal(true)} 
            disabled={isApproveDisabled}
            size="lg"
            className="w-40 shadow-md"
          >
            Approve Session
          </Button>
        </div>
      </div>

      <ApproveConfirmModal 
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={() => {
          setShowApproveModal(false);
          onApprove();
        }}
        checks={checks}
      />
    </>
  );
}
