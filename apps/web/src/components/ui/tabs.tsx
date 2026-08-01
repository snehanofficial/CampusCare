import React, { createContext, useContext } from "react";
import { cn } from "../../lib/utils.js";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Enterprise underline-style tab bar.
 * Flat bottom border with indicator underline on active item.
 */
export function TabsList({ children, className, activeValue, onValueChange }: any) {
  return (
    <div
      className={cn(
        "flex items-end gap-0 border-b border-border bg-transparent h-auto p-0",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeValue, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

interface TabsTriggerProps {
  children: React.ReactNode;
  className?: string;
  value: string;
}

export function TabsTrigger({ children, className, value }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabsTrigger must be used within Tabs");
  }
  const active = value === context.value;
  return (
    <button
      type="button"
      onClick={() => context.onValueChange(value)}
      data-state={active ? "active" : "inactive"}
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

interface TabsContentProps {
  children: React.ReactNode;
  className?: string;
  value: string;
}

export function TabsContent({ children, className, value }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabsContent must be used within Tabs");
  }
  const active = value === context.value;
  if (!active) return null;
  
  return (
    <div className={cn("outline-none animate-in fade-in duration-100", className)}>
      {children}
    </div>
  );
}
export default Tabs;
