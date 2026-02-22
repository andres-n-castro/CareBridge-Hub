import * as React from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";

import { cn } from "./utils";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  options: Map<string, React.ReactNode>;
  registerOption: (value: string, label: React.ReactNode) => void;
}

const SelectContext = React.createContext<SelectContextValue>({
  value: "",
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
  options: new Map(),
  registerOption: () => {},
});

function Select({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  children,
  ...props
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  dir?: "ltr" | "rtl";
  name?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<Map<string, React.ReactNode>>(new Map());

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = React.useCallback(
    (val: string) => {
      if (controlledValue === undefined) setInternalValue(val);
      onValueChange?.(val);
    },
    [controlledValue, onValueChange]
  );

  const registerOption = React.useCallback((val: string, label: React.ReactNode) => {
    setOptions((prev) => {
      const next = new Map(prev);
      next.set(val, label);
      return next;
    });
  }, []);

  return (
    <SelectContext.Provider
      value={{ value, onValueChange: handleValueChange, open, setOpen, options, registerOption }}
    >
      <div className="relative inline-block" data-slot="select">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

function SelectGroup({ children, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="select-group" {...props}>{children}</div>;
}

function SelectValue({
  placeholder,
  ...props
}: { placeholder?: string } & React.ComponentProps<"span">) {
  const { value, options } = React.useContext(SelectContext);
  const label = options.get(value);

  return (
    <span data-slot="select-value" data-placeholder={!value ? true : undefined} {...props}>
      {value && label ? label : placeholder || ""}
    </span>
  );
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<"button"> & {
  size?: "sm" | "default";
}) {
  const { open, setOpen } = React.useContext(SelectContext);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={triggerRef}
      type="button"
      data-slot="select-trigger"
      data-size={size}
      data-state={open ? "open" : "closed"}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <ChevronDownIcon className="size-4 opacity-50" />
    </button>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  align,
  side,
  ...props
}: React.ComponentProps<"div"> & {
  position?: "popper" | "item-aligned";
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
}) {
  const { open, setOpen } = React.useContext(SelectContext);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.parentElement?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClick);
      document.addEventListener("keydown", handleKeyDown);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  return (
    <>
      {/* Hidden registration container: always render children so SelectItems register their labels */}
      {!open && <div style={{ display: "none" }}>{children}</div>}
      {open && (
        <div
          ref={contentRef}
          data-slot="select-content"
          data-state="open"
          className={cn(
            "bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 absolute z-50 max-h-60 min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-md border shadow-md p-1 mt-1",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      )}
    </>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  value: itemValue,
  ...props
}: React.ComponentProps<"div"> & { value: string; disabled?: boolean }) {
  const { value, onValueChange, setOpen, registerOption } = React.useContext(SelectContext);
  const isSelected = value === itemValue;

  // Register this option's label
  React.useEffect(() => {
    registerOption(itemValue, children);
  }, [itemValue, children, registerOption]);

  return (
    <div
      data-slot="select-item"
      data-selected={isSelected || undefined}
      className={cn(
        "relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground data-[selected]:bg-accent/50",
        className,
      )}
      onClick={() => {
        onValueChange(itemValue);
        setOpen(false);
      }}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        {isSelected && <CheckIcon className="size-4" />}
      </span>
      <span>{children}</span>
    </div>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({ className, ...props }: React.ComponentProps<"div">) {
  return null;
}

function SelectScrollDownButton({ className, ...props }: React.ComponentProps<"div">) {
  return null;
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};