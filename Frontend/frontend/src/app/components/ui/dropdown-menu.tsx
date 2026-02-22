import * as React from "react";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";

import { cn } from "./utils";

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  open: false,
  setOpen: () => {},
});

function DropdownMenu({
  children,
  open: controlledOpen,
  onOpenChange,
  ...props
}: {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  modal?: boolean;
  dir?: "ltr" | "rtl";
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = React.useCallback(
    (val: boolean) => {
      if (!isControlled) setInternalOpen(val);
      onOpenChange?.(val);
    },
    [isControlled, onOpenChange]
  );

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div data-slot="dropdown-menu" className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function DropdownMenuTrigger({
  children,
  asChild,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { open, setOpen } = React.useContext(DropdownMenuContext);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        handleClick(e);
        (children.props as any)?.onClick?.(e);
      },
      "data-state": open ? "open" : "closed",
    });
  }

  return (
    <button
      data-slot="dropdown-menu-trigger"
      data-state={open ? "open" : "closed"}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  align = "start",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  sideOffset?: number;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
}) {
  const { open, setOpen } = React.useContext(DropdownMenuContext);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside
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
    // Delay to avoid immediate close from the trigger click
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

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      data-slot="dropdown-menu-content"
      data-state={open ? "open" : "closed"}
      className={cn(
        "bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 z-50 max-h-80 min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md absolute",
        align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0",
        className,
      )}
      style={{ marginTop: sideOffset }}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<"div">) {
  return <div data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  onClick,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  inset?: boolean;
  variant?: "default" | "destructive";
  asChild?: boolean;
  disabled?: boolean;
}) {
  const { setOpen } = React.useContext(DropdownMenuContext);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(e);
    setOpen(false);
  };

  // Handle asChild
  if ((props as any).asChild && React.isValidElement(children)) {
    return (
      <div
        data-slot="dropdown-menu-item"
        data-inset={inset}
        data-variant={variant}
        className={cn(
          "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 hover:bg-accent hover:text-accent-foreground",
          className,
        )}
        onClick={() => setOpen(false)}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<"div"> & { checked?: boolean }) {
  return (
    <div
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        {checked && <CheckIcon className="size-4" />}
      </span>
      {children}
    </div>
  );
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<"div">) {
  return <div data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <CircleIcon className="size-2 fill-current" />
      </span>
      {children}
    </div>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<"div"> & {
  inset?: boolean;
}) {
  return (
    <div
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSub({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<"div"> & { inset?: boolean }) {
  return (
    <div
      data-slot="dropdown-menu-sub-trigger"
      className={cn(
        "flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </div>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-lg",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
