import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import { Label } from "../../../components/ui/label";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "../../../components/ui/utils";

interface ApproveConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  checks: {
    requiredFields: boolean;
    followUps: boolean;
  };
}

export function ApproveConfirmModal({ isOpen, onClose, onConfirm, checks }: ApproveConfirmModalProps) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Approve this session?</DialogTitle>
          <DialogDescription>
            After approval, the session becomes read-only and will be exported to the EHR.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Required fields complete</span>
              {checks.requiredFields ? (
                <div className="flex items-center text-green-600 gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Pass
                </div>
              ) : (
                <div className="flex items-center text-destructive gap-1.5 font-medium">
                  <XCircle className="w-4 h-4" />
                  Incomplete
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Follow-ups addressed</span>
              {checks.followUps ? (
                <div className="flex items-center text-green-600 gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Pass
                </div>
              ) : (
                 <div className="flex items-center text-orange-600 gap-1.5 font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  Skipped
                </div>
              )}
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg border border-border">
            <div className="flex items-start gap-2">
              <Checkbox 
                id="confirm-accurate" 
                checked={confirmed} 
                onCheckedChange={(c) => setConfirmed(c === true)}
                className="mt-0.5"
              />
              <Label 
                htmlFor="confirm-accurate" 
                className="text-sm font-normal text-muted-foreground leading-snug cursor-pointer"
              >
                I confirm that I have reviewed the intake form and the information is accurate to the best of my knowledge.
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={onConfirm} 
            disabled={!confirmed || !checks.requiredFields}
            className={cn(!checks.requiredFields && "opacity-50 cursor-not-allowed")}
          >
            Approve Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
