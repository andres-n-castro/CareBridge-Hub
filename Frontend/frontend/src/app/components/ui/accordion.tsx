import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "./utils";

interface AccordionContextValue {
  openItems: string[];
  toggle: (value: string) => void;
  type: "single" | "multiple";
}

const AccordionContext = React.createContext<AccordionContextValue>({
  openItems: [],
  toggle: () => {},
  type: "multiple",
});

interface AccordionProps extends React.ComponentProps<"div"> {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: any) => void;
  collapsible?: boolean;
}

function Accordion({
  type = "multiple",
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  ...props
}: AccordionProps) {
  const [internalOpen, setInternalOpen] = React.useState<string[]>(() => {
    if (defaultValue) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    }
    return [];
  });

  const openItems = controlledValue !== undefined
    ? (Array.isArray(controlledValue) ? controlledValue : [controlledValue])
    : internalOpen;

  const toggle = React.useCallback(
    (itemValue: string) => {
      let newOpen: string[];
      if (type === "single") {
        newOpen = openItems.includes(itemValue) ? [] : [itemValue];
      } else {
        newOpen = openItems.includes(itemValue)
          ? openItems.filter((v) => v !== itemValue)
          : [...openItems, itemValue];
      }
      if (controlledValue === undefined) {
        setInternalOpen(newOpen);
      }
      onValueChange?.(type === "single" ? (newOpen[0] ?? "") : newOpen);
    },
    [openItems, type, controlledValue, onValueChange]
  );

  return (
    <AccordionContext.Provider value={{ openItems, toggle, type }}>
      <div data-slot="accordion" {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

const AccordionItemContext = React.createContext<string>("");

function AccordionItem({
  className,
  value,
  children,
  ...props
}: React.ComponentProps<"div"> & { value: string }) {
  return (
    <AccordionItemContext.Provider value={value}>
      <div
        data-slot="accordion-item"
        data-state={undefined} // will be set via context
        className={cn("border-b last:border-b-0", className)}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const { openItems, toggle } = React.useContext(AccordionContext);
  const value = React.useContext(AccordionItemContext);
  const isOpen = openItems.includes(value);

  return (
    <div className="flex">
      <button
        type="button"
        data-slot="accordion-trigger"
        data-state={isOpen ? "open" : "closed"}
        className={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        onClick={() => toggle(value)}
        aria-expanded={isOpen}
        {...props}
      >
        {children}
        <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </button>
    </div>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { forceMount?: boolean }) {
  const { openItems } = React.useContext(AccordionContext);
  const value = React.useContext(AccordionItemContext);
  const isOpen = openItems.includes(value);

  if (!isOpen) return null;

  return (
    <div
      data-slot="accordion-content"
      data-state={isOpen ? "open" : "closed"}
      className="overflow-hidden text-sm animate-in fade-in-0 slide-in-from-top-1"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </div>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
