import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  loading = false,
  disabled,
  children,
  className,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`
        h-[44px] px-6 rounded-lg
        bg-primary text-primary-foreground
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary/50
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:opacity-90
        ${className || ''}
      `}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Signing in…
        </span>
      ) : (
        children
      )}
    </button>
  );
};
