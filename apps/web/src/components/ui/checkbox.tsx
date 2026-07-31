import React from "react";
import { cn } from "../../lib/utils.js";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "size-4 shrink-0 rounded border border-input text-primary bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 accent-primary cursor-pointer",
          className
        )}
        {...props}
      />
    );
  }
);

Checkbox.displayName = "Checkbox";
