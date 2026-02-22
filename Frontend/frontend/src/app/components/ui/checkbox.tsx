import * as React from "react";
import { CheckIcon } from "lucide-react";

import { cn } from "./utils";

interface CheckboxProps extends Omit<React.ComponentPropsWithoutRef<"button">, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  defaultChecked?: boolean;
  id?: string;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, defaultChecked, id, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked ?? false);
    const isChecked = checked !== undefined ? checked : internalChecked;

    const toggle = () => {
      const newValue = !isChecked;
      if (checked === undefined) {
        setInternalChecked(newValue);
      }
      onCheckedChange?.(newValue);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      toggle();
    };

    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={isChecked}
        data-slot="checkbox"
        data-state={isChecked ? "checked" : "unchecked"}
        className={cn(
          "peer border bg-input-background dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center justify-center",
          className,
        )}
        onClick={handleClick}
        {...props}
      >
        {isChecked && (
          <span
            data-slot="checkbox-indicator"
            className="flex items-center justify-center text-current transition-none"
          >
            <CheckIcon className="size-3.5" />
          </span>
        )}
        {/* Hidden input for htmlFor label association */}
        <input
          type="checkbox"
          id={id}
          checked={isChecked}
          onChange={toggle}
          aria-hidden
          tabIndex={-1}
          style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", opacity: 0, pointerEvents: "none" }}
        />
      </button>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };