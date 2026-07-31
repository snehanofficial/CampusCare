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

export function TabsList({ children, className, value, onValueChange }: any) {
  return (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}>
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
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3.5 py-1.5 text-xs font-semibold transition-all focus:outline-none disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
        active ? "bg-background text-foreground shadow-xs" : "hover:text-foreground/80",
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
