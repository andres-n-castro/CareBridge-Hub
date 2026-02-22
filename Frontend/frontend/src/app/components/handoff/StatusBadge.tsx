import { Badge } from "../ui/badge";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { cn } from "../ui/utils";

export type HandoffStatus = "needs_review" | "approved" | "failed";

interface StatusBadgeProps {
  status: HandoffStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (status === "approved") {
    return (
      <Badge variant="outline" className={cn("bg-green-50 text-green-700 border-green-200 gap-1.5 px-2.5 py-0.5", className)}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        Approved
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge variant="outline" className={cn("bg-red-50 text-red-700 border-red-200 gap-1.5 px-2.5 py-0.5", className)}>
        <XCircle className="w-3.5 h-3.5" />
        Failed
      </Badge>
    );
  }

  // needs_review
  return (
    <Badge variant="outline" className={cn("bg-amber-50 text-amber-700 border-amber-200 gap-1.5 px-2.5 py-0.5", className)}>
      <AlertCircle className="w-3.5 h-3.5" />
      Needs Review
    </Badge>
  );
}
