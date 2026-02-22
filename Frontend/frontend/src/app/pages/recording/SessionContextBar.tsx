import { useState, useRef, useEffect } from "react";
import { Pencil, Check, Sparkles } from "lucide-react";
import { cn } from "../../components/ui/utils";
import { Input } from "../../components/ui/input";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SessionContext {
  patientId: string;
  unit: string;
  created: string; // ISO string
}

interface SessionContextBarProps {
  context: SessionContext;
  suggestions: SessionContext;
  onChange: (context: SessionContext) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

/** Convert ISO → datetime-local value (YYYY-MM-DDTHH:MM) */
function toDateTimeLocal(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

/** Convert datetime-local value back to ISO */
function fromDateTimeLocal(val: string): string {
  try {
    return new Date(val).toISOString();
  } catch {
    return val;
  }
}

// ── Inline Editable Field ──────────────────────────────────────────────────────

interface InlineFieldProps {
  label: string;
  value: string;
  displayValue?: string;
  isSuggested: boolean;
  inputType?: "text" | "datetime-local";
  mono?: boolean;
  onChange: (value: string) => void;
}

function InlineField({
  label,
  value,
  displayValue,
  isSuggested,
  inputType = "text",
  mono = false,
  onChange,
}: InlineFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep draft in sync when value changes externally
  useEffect(() => {
    if (!editing) {
      setDraft(value);
    }
  }, [value, editing]);

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      onChange(inputType === "datetime-local" ? fromDateTimeLocal(trimmed) : trimmed);
    } else {
      setDraft(value); // Revert if empty
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {label}:
        </span>
        <div className="relative flex items-center">
          <Input
            ref={inputRef}
            type={inputType}
            value={inputType === "datetime-local" ? toDateTimeLocal(draft) : draft}
            onChange={(e) =>
              setDraft(
                inputType === "datetime-local"
                  ? e.target.value // keep as datetime-local format in draft
                  : e.target.value
              )
            }
            onBlur={commit}
            onKeyDown={handleKeyDown}
            className={cn(
              "h-7 text-sm px-2 py-0 min-w-0",
              inputType === "text" ? "w-36" : "w-52",
              mono && "font-mono"
            )}
          />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault(); // prevent blur before commit
              commit();
            }}
            className="ml-1 h-6 w-6 rounded flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors"
            aria-label="Confirm"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 group/field">
      <span className="text-muted-foreground text-xs whitespace-nowrap">
        {label}:
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 -mx-1.5 -my-0.5 transition-colors",
          "hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1",
          "cursor-pointer"
        )}
      >
        <span
          className={cn(
            "font-medium text-slate-900",
            mono && "font-mono"
          )}
        >
          {displayValue ?? value}
        </span>
        <Pencil className="h-3 w-3 text-slate-400 opacity-0 group-hover/field:opacity-100 transition-opacity" />
      </button>
      {isSuggested && (
        <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-1.5 py-px whitespace-nowrap">
          <Sparkles className="h-2.5 w-2.5" />
          Suggested
        </span>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function SessionContextBar({
  context,
  suggestions,
  onChange,
}: SessionContextBarProps) {
  const update = (field: keyof SessionContext, value: string) => {
    onChange({ ...context, [field]: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">
      <InlineField
        label="Patient ID"
        value={context.patientId}
        isSuggested={context.patientId === suggestions.patientId}
        mono
        onChange={(v) => update("patientId", v)}
      />

      <div className="hidden sm:block h-4 w-px bg-slate-200" />

      <InlineField
        label="Unit"
        value={context.unit}
        isSuggested={context.unit === suggestions.unit}
        onChange={(v) => update("unit", v)}
      />

      <div className="hidden sm:block h-4 w-px bg-slate-200" />

      <InlineField
        label="Visit"
        value={context.created}
        displayValue={formatDateTime(context.created)}
        isSuggested={context.created === suggestions.created}
        inputType="datetime-local"
        onChange={(v) => update("created", v)}
      />
    </div>
  );
}