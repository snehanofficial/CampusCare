import React from "react";
import { Button } from "../ui/button.js";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown.js";

export interface ActionItem {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  icon?: React.ComponentType<{ className?: string }>;
}

interface ActionToolbarProps {
  selectedCount?: number;
  bulkActions?: ActionItem[];
  actions?: ActionItem[];
}

export function ActionToolbar({
  selectedCount = 0,
  bulkActions = [],
  actions = [],
}: ActionToolbarProps) {
  return (
    <div className="flex h-12 w-full items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 transition-all duration-200">
      {/* Selection State */}
      <div className="flex items-center gap-2">
        {selectedCount > 0 ? (
          <span className="text-xs font-semibold text-foreground animate-pulse select-none">
            {selectedCount} item{selectedCount > 1 ? "s" : ""} selected
          </span>
        ) : (
          <span className="text-xs text-muted-foreground select-none">
            No items selected
          </span>
        )}
      </div>

      {/* Primary/Secondary Actions and Bulk Actions Dropdowns */}
      <div className="flex items-center gap-2">
        {/* Bulk Actions */}
        {selectedCount > 0 && bulkActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 cursor-pointer">
                <span>Bulk Actions</span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {bulkActions.map((action) => {
                const Icon = action.icon;
                return (
                  <DropdownMenuItem
                    key={action.label}
                    onClick={action.onClick}
                    className={`text-xs font-semibold ${
                      action.variant === "destructive" ? "text-destructive hover:bg-destructive/5" : ""
                    }`}
                  >
                    {Icon && <Icon className="size-3.5 mr-1.5 flex-shrink-0" />}
                    {action.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Standard Page Actions */}
        {actions.length > 0 && (
          <div className="flex items-center gap-1.5">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant={action.variant || "primary"}
                  size="sm"
                  onClick={action.onClick}
                  className="text-xs h-8 flex items-center gap-1.5 cursor-pointer"
                >
                  {Icon && <Icon className="size-3.5" />}
                  <span>{action.label}</span>
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
export default ActionToolbar;
