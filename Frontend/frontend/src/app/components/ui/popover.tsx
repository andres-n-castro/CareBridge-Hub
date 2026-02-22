import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "./utils";

interface PopoverContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const PopoverContext = React.createContext<PopoverContextValue>({
  open: false,
  onOpenChange: () => {},
  anchorRef: { current: null },
  triggerRef: { current: null },
});

function Popover({
  open: controlledOpen,
  onOpenChange,
  children,
  ...props
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  modal?: boolean;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const anchorRef = React.useRef<HTMLElement | null>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  const handleOpenChange = React.useCallback(
    (val: boolean) => {
      if (controlledOpen === undefined) setInternalOpen(val);
      onOpenChange?.(val);
    },
    [controlledOpen, onOpenChange]
  );

  return (
    <PopoverContext.Provider value={{ open, onOpenChange: handleOpenChange, anchorRef, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  );
}

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button"> & { asChild?: boolean }
>(({ className, asChild, children, ...props }, ref) => {
  const { open, onOpenChange, triggerRef } = React.useContext(PopoverContext);

  const combinedRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    },
    [ref, triggerRef]
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: combinedRef,
      onClick: (e: React.MouseEvent) => {
        onOpenChange(!open);
        (children.props as any)?.onClick?.(e);
      },
    });
  }

  return (
    <button
      ref={combinedRef}
      data-slot="popover-trigger"
      onClick={() => onOpenChange(!open)}
      {...props}
    >
      {children}
    </button>
  );
});
PopoverTrigger.displayName = "PopoverTrigger";

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    align?: "start" | "center" | "end";
    sideOffset?: number;
    side?: "top" | "bottom" | "left" | "right";
    onOpenAutoFocus?: (e: Event) => void;
  }
>(({ className, align = "center", sideOffset = 4, side = "bottom", children, onOpenAutoFocus, ...props }, ref) => {
  const { open, onOpenChange, anchorRef, triggerRef } = React.useContext(PopoverContext);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  // Calculate position
  React.useEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current || triggerRef.current;
    if (!anchor) return;

    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect();
      const contentEl = contentRef.current;
      const contentWidth = contentEl?.offsetWidth || 288;
      const contentHeight = contentEl?.offsetHeight || 0;

      let top = 0;
      let left = 0;

      if (side === "bottom") {
        top = rect.bottom + sideOffset + window.scrollY;
        if (align === "start") left = rect.left + window.scrollX;
        else if (align === "end") left = rect.right - contentWidth + window.scrollX;
        else left = rect.left + rect.width / 2 - contentWidth / 2 + window.scrollX;
      } else if (side === "top") {
        top = rect.top - contentHeight - sideOffset + window.scrollY;
        if (align === "start") left = rect.left + window.scrollX;
        else if (align === "end") left = rect.right - contentWidth + window.scrollX;
        else left = rect.left + rect.width / 2 - contentWidth / 2 + window.scrollX;
      } else if (side === "right") {
        left = rect.right + sideOffset + window.scrollX;
        if (align === "start") top = rect.top + window.scrollY;
        else if (align === "end") top = rect.bottom - contentHeight + window.scrollY;
        else top = rect.top + rect.height / 2 - contentHeight / 2 + window.scrollY;
      } else if (side === "left") {
        left = rect.left - contentWidth - sideOffset + window.scrollX;
        if (align === "start") top = rect.top + window.scrollY;
        else if (align === "end") top = rect.bottom - contentHeight + window.scrollY;
        else top = rect.top + rect.height / 2 - contentHeight / 2 + window.scrollY;
      }

      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, anchorRef, triggerRef, side, align, sideOffset]);

  // Close on click outside
  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const anchor = anchorRef.current || triggerRef.current;
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        anchor &&
        !anchor.contains(e.target as Node)
      ) {
        onOpenChange(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange, anchorRef, triggerRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={(node) => {
        (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      data-slot="popover-content"
      data-state="open"
      className={cn(
        "bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 z-50 w-72 rounded-md border p-4 shadow-md outline-hidden",
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
});
PopoverContent.displayName = "PopoverContent";

const PopoverAnchor = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => {
  const { anchorRef } = React.useContext(PopoverContext);

  const combinedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      (anchorRef as React.MutableRefObject<HTMLElement | null>).current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [ref, anchorRef]
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: combinedRef,
    });
  }

  return (
    <div ref={combinedRef} data-slot="popover-anchor" {...props}>
      {children}
    </div>
  );
});
PopoverAnchor.displayName = "PopoverAnchor";

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
