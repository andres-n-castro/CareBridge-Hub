import React, { forwardRef, InputHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  id: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, id, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        <label
          htmlFor={id}
          className="text-foreground"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={`
            h-[44px] px-4 rounded-lg
            bg-input-background border border-border
            text-foreground
            outline-none
            transition-all duration-200
            focus:border-primary focus:ring-2 focus:ring-primary/10
            ${error ? 'border-destructive focus:border-destructive focus:ring-destructive/10' : ''}
            ${className || ''}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {error && (
          <div
            id={`${id}-error`}
            className="flex items-center gap-2 text-destructive"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';
