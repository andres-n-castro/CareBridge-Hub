import React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

interface CheckboxProps {
  id: string;
  label: string;
  helperText?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  label,
  helperText,
  checked,
  onCheckedChange,
}) => {
  return (
    <div className="flex items-start gap-3">
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={(checked) => onCheckedChange?.(checked === true)}
        className="
          h-5 w-5 flex-shrink-0 mt-0.5
          rounded border-2 border-border
          bg-input-background
          focus:outline-none focus:ring-2 focus:ring-primary/50
          data-[state=checked]:bg-primary data-[state=checked]:border-primary
          transition-all duration-200
        "
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-primary-foreground">
          <Check className="h-4 w-4" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <div className="flex flex-col gap-1">
        <label
          htmlFor={id}
          className="text-foreground cursor-pointer select-none"
        >
          {label}
        </label>
        {helperText && (
          <span className="text-xs text-muted-foreground">{helperText}</span>
        )}
      </div>
    </div>
  );
};
