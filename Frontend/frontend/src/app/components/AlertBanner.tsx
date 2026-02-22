import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from './ui/utils';

interface AlertBannerProps {
  message?: string;
  title?: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

const icons = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const styles = {
  error: "bg-red-50 text-red-900 border-red-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  info: "bg-blue-50 text-blue-900 border-blue-200",
  success: "bg-green-50 text-green-900 border-green-200",
};

export const AlertBanner: React.FC<AlertBannerProps> = ({ 
  message, 
  title, 
  type = 'error', 
  action, 
  className,
  children 
}) => {
  const Icon = icons[type];
  
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border",
        styles[type],
        className
      )}
      role="alert"
    >
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        {title && <h5 className="font-medium mb-1">{title}</h5>}
        {message && <p className="text-sm opacity-90">{message}</p>}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};
