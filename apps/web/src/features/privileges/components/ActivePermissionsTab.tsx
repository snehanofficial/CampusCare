import React, { useState } from "react";
import { Ban } from "lucide-react";
import { DataTable } from "../../../components/ui/data-table.js";
import { Button } from "../../../components/ui/button.js";
import { Input } from "../../../components/ui/input.js";
import { Tag } from "../../../components/ui/tag.js";
import type { ColumnDef } from "@tanstack/react-table";
import { useActiveGrants, useCountdown, useRevokeGrant } from "../hooks/index.js";
import { approvalLevelVariant, formatDuration } from "../utils/index.js";
import { RemainingTime } from "./RemainingTime.js";
import { ReasonDialog } from "./ReasonDialog.js";
import type { TemporaryGrant } from "../types/index.js";

interface ActivePermissionsTabProps {
  active: boolean;
}

export function ActivePermissionsTab({ active }: ActivePermissionsTabProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useActiveGrants({ search, page, pageSize: 8 }, active);
  const revoke = useRevokeGrant();
  const [revokeTarget, setRevokeTarget] = useState<TemporaryGrant | null>(null);

  // One ticker drives every countdown cell in the table.
  const now = useCountdown(active);

  const columns: ColumnDef<TemporaryGrant>[] = [
    {
      id: "user",
      header: "User",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-bold text-foreground">
            {row.original.user.firstName} {row.original.user.lastName}
          </p>
          <p className="text-[10px] text-muted-foreground">{row.original.user.email}</p>
        </div>
      ),
    },
    {
      id: "permission",
      header: "Permission",
      cell: ({ row }) => (
        <div>
          <p className="text-[11px] font-semibold text-foreground">
            {row.original.permission.displayName}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {row.original.permission.code}
          </p>
        </div>
      ),
    },
    {
      id: "level",
      header: "Risk",
      cell: ({ row }) => (
        <Tag variant={approvalLevelVariant(row.original.approvalLevel)}>
          {row.original.approvalLevel ?? "LOW"}
        </Tag>
      ),
    },
    {
      id: "granted",
      header: "Granted For",
      cell: ({ row }) => (
        <span className="text-[11px] font-semibold text-muted-foreground">
          {formatDuration(row.original.durationMinutes)}
        </span>
      ),
    },
    {
      id: "remaining",
      header: "Time Remaining",
      cell: ({ row }) => <RemainingTime expiresAt={row.original.expiresAt} now={now} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="xs"
          loading={revoke.isPending}
          onClick={() => setRevokeTarget(row.original)}
          className="flex items-center gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <Ban className="size-3" />
          Revoke
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <Input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search by user or permission..."
        className="max-w-64"
        aria-label="Search active permissions"
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        pageIndex={page}
        pageCount={data?.pageCount ?? 1}
        onPageChange={setPage}
        emptyMessage="No temporary permissions are currently active."
      />

      <ReasonDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Revoke temporary access"
        description={
          revokeTarget
            ? `Revoke "${revokeTarget.permission.displayName}" from ${revokeTarget.user.firstName} ${revokeTarget.user.lastName}? This takes effect immediately.`
            : undefined
        }
        confirmLabel="Revoke Access"
        destructive
        loading={revoke.isPending}
        onConfirm={(reason) => {
          if (revokeTarget) revoke.mutate({ grantId: revokeTarget.id, reason });
        }}
      />
    </div>
  );
}
