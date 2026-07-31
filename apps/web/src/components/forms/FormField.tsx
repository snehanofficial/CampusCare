import React, { useId } from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export function FormField({ label, error, required, hint, children }: FormFieldProps) {
  const generatedId = useId();

  // Inspect children to extract ID or clone with custom properties
  const child = React.Children.only(children) as React.ReactElement<any>;
  const inputId = child.props.id || generatedId;

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-foreground uppercase tracking-wider select-none"
        >
          {label}
          {required && (
            <span className="ml-1 text-destructive font-bold" aria-hidden="true">
              *
            </span>
          )}
        </label>
      </div>

      {React.cloneElement(child, {
        id: inputId,
        "aria-required": required ? "true" : undefined,
        "aria-invalid": error ? "true" : undefined,
        "aria-describedby": error
          ? `${inputId}-error`
          : hint
          ? `${inputId}-hint`
          : undefined,
      })}

      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-[11px] text-muted-foreground">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={`${inputId}-error`}
          className="text-xs text-destructive font-medium animate-in fade-in duration-100"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}
export default FormField;
