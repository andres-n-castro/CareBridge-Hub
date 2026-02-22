import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "./utils";

function TooltipProvider({
  delayDuration = 0,
  children,
  ...props
}: {
  delayDuration?: number;
  children?: React.ReactNode;
  skipDelayDuration?: number;
  disableHoverableContent?: boolean;
}) {
  return <>{children}</>;
}

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const TooltipContext = React.createContext<TooltipContextValue>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
});

function Tooltip({
  children,
  open: controlledOpen,
  onOpenChange,
  ...props
}: {
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
  disableHoverableContent?: boolean;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const triggerRef = React.useRef<HTMLElement | null>(null);

  const setOpen = React.useCallback(
    (val: boolean) => {
      if (controlledOpen === undefined) setInternalOpen(val);
      onOpenChange?.(val);
    },
    [controlledOpen, onOpenChange]
  );

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </TooltipContext.Provider>
  );
}

function TooltipTrigger({
  children,
  asChild,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { setOpen, triggerRef } = React.useContext(TooltipContext);

  const handleRef = React.useCallback(
    (node: HTMLElement | null) => {
      (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
    },
    [triggerRef]
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: handleRef,
      onMouseEnter: (e: React.MouseEvent) => {
        setOpen(true);
        (children.props as any)?.onMouseEnter?.(e);
      },
      onMouseLeave: (e: React.MouseEvent) => {
        setOpen(false);
        (children.props as any)?.onMouseLeave?.(e);
      },
      onFocus: (e: React.FocusEvent) => {
        setOpen(true);
        (children.props as any)?.onFocus?.(e);
      },
      onBlur: (e: React.FocusEvent) => {
        setOpen(false);
        (children.props as any)?.onBlur?.(e);
      },
    });
  }

  return (
    <button
      ref={handleRef as React.RefCallback<HTMLButtonElement>}
      data-slot="tooltip-trigger"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      {...props}
    >
      {children}
    </button>
  );
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  side = "top",
  ...props
}: React.ComponentProps<"div"> & {
  sideOffset?: number;
  side?: "top" | "bottom" | "left" | "right";
}) {
  const { open, triggerRef } = React.useContext(TooltipContext);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const contentEl = contentRef.current;
    const contentWidth = contentEl?.offsetWidth || 100;
    const contentHeight = contentEl?.offsetHeight || 30;

    let top = 0;
    let left = 0;

    if (side === "top") {
      top = rect.top - contentHeight - sideOffset + window.scrollY;
      left = rect.left + rect.width / 2 - contentWidth / 2 + window.scrollX;
    } else if (side === "bottom") {
      top = rect.bottom + sideOffset + window.scrollY;
      left = rect.left + rect.width / 2 - contentWidth / 2 + window.scrollX;
    }

    setPosition({ top, left });
  }, [open, triggerRef, side, sideOffset]);

  if (!open) return null;

  return createPortal(
    <div
      ref={contentRef}
      data-slot="tooltip-content"
      className={cn(
        "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 z-50 w-fit rounded-md px-3 py-1.5 text-xs text-balance",
        className,
      )}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
      }}
      {...props}
    >
      {children}
    </div>,
    document.body
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
