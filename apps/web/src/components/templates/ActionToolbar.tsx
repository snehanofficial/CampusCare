import React from "react";
import { Button } from "../ui/button.js";
import { ChevronDown, CheckSquare, Layers } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown.js";

export interface ActionItem {
  label: string;
  onClick: () => void;
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "destructive";
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
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
    <div className="flex h-10 w-full items-center justify-between rounded-sm border border-border bg-surface-subtle/50 px-3 select-none">
      {/* Selection Counter State */}
      <div className="flex items-center gap-2">
        {selectedCount > 0 ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <CheckSquare className="size-3.5 text-primary" />
            <span>
              {selectedCount} item{selectedCount > 1 ? "s" : ""} selected
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers className="size-3.5 text-muted-foreground/60" />
            <span>Select items to run bulk operations</span>
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Bulk Actions Dropdown */}
        {selectedCount > 0 && bulkActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="xs" className="h-7 gap-1.5 font-bold cursor-pointer">
                <span>Bulk Actions ({selectedCount})</span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {bulkActions.map((action) => {
                const Icon = action.icon;
                return (
                  <DropdownMenuItem
                    key={action.label}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`text-xs font-semibold ${
                      action.variant === "destructive" ? "text-destructive hover:bg-destructive/10" : ""
                    } ${action.disabled ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    {Icon && <Icon className="size-3.5 mr-1.5 flex-shrink-0" />}
                    {action.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Page Actions */}
        {actions.length > 0 && (
          <div className="flex items-center gap-1.5">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant={action.variant || "default"}
                  size="xs"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="h-7 text-xs flex items-center gap-1.5 cursor-pointer"
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
