import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Mic, 
  FileText,
  Clock
} from "lucide-react";

export type SessionStatus = 'Recording' | 'Processing' | 'Ready' | 'Approved' | 'Failed';

interface StatusBadgeProps {
  status: SessionStatus;
  className?: string;
}

const statusConfig: Record<SessionStatus, { 
  icon: React.ElementType;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
}> = {
  Recording: {
    icon: Mic,
    label: "Recording",
    variant: "destructive",
    className: "bg-red-50 text-red-700 hover:bg-red-50 border-red-200"
  },
  Processing: {
    icon: Loader2,
    label: "Processing",
    variant: "secondary",
    className: "bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200 animate-pulse"
  },
  Ready: {
    icon: FileText,
    label: "Ready",
    variant: "outline",
    className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200"
  },
  Approved: {
    icon: CheckCircle2,
    label: "Approved",
    variant: "outline",
    className: "bg-green-50 text-green-700 hover:bg-green-50 border-green-200"
  },
  Failed: {
    icon: XCircle,
    label: "Failed",
    variant: "destructive",
    className: "bg-red-50 text-red-700 hover:bg-red-50 border-red-200"
  }
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        "gap-1.5 py-1 px-2.5 font-medium border shadow-sm", 
        config.className,
        className
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", status === 'Processing' && "animate-spin")} />
      {config.label}
    </Badge>
  );
}
