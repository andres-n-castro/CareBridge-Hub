import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "motion/react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProgressBarProps {
  progress?: number; // 0-100
  isIndeterminate?: boolean;
  className?: string;
  variant?: "default" | "success" | "error";
}

export function ProgressBar({ 
  progress = 0, 
  isIndeterminate = false, 
  className,
  variant = "default"
}: ProgressBarProps) {
  
  const bgColor = {
    default: "bg-primary",
    success: "bg-green-500",
    error: "bg-red-500",
  }[variant];

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}>
      {isIndeterminate ? (
        <motion.div
          className={cn("h-full w-1/3 rounded-full", bgColor)}
          animate={{
            x: ["-100%", "400%"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ) : (
        <motion.div
          className={cn("h-full rounded-full transition-all duration-500 ease-in-out", bgColor)}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      )}
    </div>
  );
}
