import { AlertTriangle, HelpCircle, MessageSquare } from "lucide-react";
import { cn } from "../ui/utils";

export type AttentionType = "missing" | "uncertain" | "follow_up";

interface AttentionChipProps {
  type: AttentionType;
  count: number;
  className?: string;
}

export function AttentionChip({ type, count, className }: AttentionChipProps) {
  if (count <= 0) return null;

  const config = {
    missing: {
      icon: AlertTriangle,
      label: "Missing",
      colors: "text-amber-700 bg-amber-50 border-amber-200",
    },
    uncertain: {
      icon: HelpCircle,
      label: "Uncertain",
      colors: "text-orange-700 bg-orange-50 border-orange-200",
    },
    follow_up: {
      icon: MessageSquare,
      label: "Follow-ups",
      colors: "text-blue-700 bg-blue-50 border-blue-200",
    },
  };

  const { icon: Icon, label, colors } = config[type];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        colors,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {label}: {count}
    </div>
  );
}

interface AttentionSummaryProps {
  missing?: number;
  uncertain?: number;
  followUps?: number;
}

export function AttentionSummary({ missing = 0, uncertain = 0, followUps = 0 }: AttentionSummaryProps) {
  const hasAttention = missing > 0 || uncertain > 0 || followUps > 0;

  if (!hasAttention) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <AttentionChip type="missing" count={missing} />
      <AttentionChip type="uncertain" count={uncertain} />
      <AttentionChip type="follow_up" count={followUps} />
    </div>
  );
}
