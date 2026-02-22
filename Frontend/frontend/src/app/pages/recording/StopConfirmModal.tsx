import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Label } from "../../components/ui/label";
import { useState } from "react";

interface StopConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function StopConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: StopConfirmModalProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>End session?</DialogTitle>
          <DialogDescription>
            This will stop recording and prepare the audio for upload and processing.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 py-2">
          <Checkbox 
            id="dont-ask" 
            checked={dontAskAgain}
            onCheckedChange={(checked) => setDontAskAgain(checked as boolean)}
          />
          <Label htmlFor="dont-ask" className="text-sm text-muted-foreground font-normal">
            Don't ask again on this device
          </Label>
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Continue Recording
          </Button>
          <Button variant="default" onClick={onConfirm}>
            End Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
