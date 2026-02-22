import * as React from "react";
import { createPortal } from "react-dom";
import { XIcon } from "lucide-react";

import { cn } from "./utils";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue>({
  open: false,
  onOpenChange: () => {},
});

function Dialog({
  open = false,
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
  const handleOpenChange = React.useCallback(
    (val: boolean) => onOpenChange?.(val),
    [onOpenChange]
  );

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({
  children,
  asChild,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { onOpenChange } = React.useContext(DialogContext);
  const handleClick = () => onOpenChange(true);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
    });
  }

  return (
    <button data-slot="dialog-trigger" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

function DialogPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function DialogClose({
  children,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { onOpenChange } = React.useContext(DialogContext);
  return (
    <button data-slot="dialog-close" onClick={() => onOpenChange(false)} {...props}>
      {children}
    </button>
  );
}

const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 animate-in fade-in-0",
        className,
      )}
      {...props}
    />
  );
});
DialogOverlay.displayName = "DialogOverlay";

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, children, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(DialogContext);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Body scroll lock
  React.useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <>
      <DialogOverlay onClick={() => onOpenChange(false)} />
      <div
        ref={ref}
        data-slot="dialog-content"
        className={cn(
          "bg-background animate-in fade-in-0 zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className,
        )}
        {...props}
      >
        {children}
        <button
          className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          onClick={() => onOpenChange(false)}
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </>,
    document.body,
  );
});
DialogContent.displayName = "DialogContent";

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<"h2">
>(({ className, ...props }, ref) => {
  return (
    <h2
      ref={ref}
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
});
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<"p">
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
});
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};