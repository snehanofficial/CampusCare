import React from "react";
import { cn } from "../../lib/utils.js";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { value, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

/**
 * Enterprise underline-style tab bar.
 * Flat bottom border with indicator underline on active item.
 * Avoids the shadcn rounded-pill background pattern entirely.
 */
export function TabsList({ children, className, value, onValueChange }: any) {
  return (
    <div
      className={cn(
        "flex items-end gap-0 border-b border-border bg-transparent h-auto p-0",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeValue: value, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

export function TabsTrigger({ children, className, value, activeValue, onValueChange }: any) {
  const active = value === activeValue;
  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={cn(
        "relative inline-flex items-center gap-1.5 px-3 pb-2.5 pt-0.5 text-xs font-semibold transition-colors duration-100 whitespace-nowrap select-none cursor-pointer focus:outline-none disabled:pointer-events-none disabled:opacity-50",
        "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-full after:transition-colors after:duration-100",
        active
          ? "text-foreground after:bg-primary"
          : "text-muted-foreground hover:text-foreground after:bg-transparent",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, className, value, activeValue }: any) {
  const active = value === activeValue;
  if (!active) return null;
  return (
    <div className={cn("outline-none animate-in fade-in duration-100", className)}>
      {children}
    </div>
  );
}
