import React, { useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { Input } from "../../../components/ui/input.js";
import { Checkbox } from "../../../components/ui/checkbox.js";
import { Button } from "../../../components/ui/button.js";
import { LoadingSpinner } from "../../../components/ui/loading-spinner.js";
import { usePermissionRegistry } from "../hooks/index.js";
import type { PermissionRef } from "../types/index.js";

interface PermissionSelectorProps {
  value: string[];
  onChange: (permissionIds: string[]) => void;
  enabled?: boolean;
  error?: string | undefined;
}

/**
 * Grouped permission picker driven entirely by `GET /permissions/registry`.
 * Nothing is hardcoded: categories and group labels come from the database.
 */
export function PermissionSelector({
  value,
  onChange,
  enabled = true,
  error,
}: PermissionSelectorProps) {
  const [search, setSearch] = useState("");
  const { data: registry, isLoading } = usePermissionRegistry(enabled);

  const selected = useMemo(() => new Set(value), [value]);

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (registry?.categories ?? [])
      .map((cat) => ({
        category: cat.category,
        permissions: cat.permissions.filter(
          (p) =>
            !query ||
            p.displayName.toLowerCase().includes(query) ||
            p.code.toLowerCase().includes(query) ||
            p.groupLabel.toLowerCase().includes(query),
        ),
      }))
      .filter((cat) => cat.permissions.length > 0);
  }, [registry, search]);

  const visibleIds = useMemo(
    () => groups.flatMap((g) => g.permissions.map((p: PermissionRef) => p.id)),
    [groups],
  );

  const toggle = (id: string) => {
    onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      onChange(value.filter((v) => !visibleIds.includes(v)));
    } else {
      onChange([...new Set([...value, ...visibleIds])]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search permissions..."
            className="pl-8"
            aria-label="Search permissions"
          />
        </div>
        <Button
          variant="outline"
          size="xs"
          onClick={toggleAllVisible}
          disabled={visibleIds.length === 0}
        >
          {allVisibleSelected ? "Clear all" : "Select all"}
        </Button>
      </div>

      <div className="max-h-56 overflow-y-auto rounded-sm border border-border bg-background p-2">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner />
          </div>
        ) : groups.length === 0 ? (
          <p className="py-6 text-center text-[11px] text-muted-foreground">
            No permissions match your search.
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.category} className="mb-3 last:mb-0">
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                <ShieldCheck className="size-3" />
                {group.category}
              </p>
              <div className="grid gap-1 sm:grid-cols-2">
                {group.permissions.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex cursor-pointer items-start gap-2 rounded-sm px-1.5 py-1 hover:bg-muted/60"
                  >
                    <Checkbox
                      checked={selected.has(permission.id)}
                      onChange={() => toggle(permission.id)}
                      className="mt-0.5"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-semibold text-foreground">
                        {permission.displayName}
                      </span>
                      <span className="block truncate font-mono text-[10px] text-muted-foreground">
                        {permission.code}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          {value.length} permission{value.length === 1 ? "" : "s"} selected
        </p>
        {error && <p className="text-[10px] font-semibold text-destructive">{error}</p>}
      </div>
    </div>
  );
}
