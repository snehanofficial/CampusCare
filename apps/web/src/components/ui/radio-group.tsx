import React from "react";
import { cn } from "../../lib/utils.js";

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function RadioGroup({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("grid gap-2", className)}>{children}</div>;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="radio"
          id={inputId}
          className={cn(
            "size-4 border border-input text-primary bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 accent-primary cursor-pointer",
            className
          )}
          {...props}
        />
        <label htmlFor={inputId} className="text-sm font-medium text-foreground select-none cursor-pointer">
          {label}
        </label>
      </div>
    );
  }
);

Radio.displayName = "Radio";
