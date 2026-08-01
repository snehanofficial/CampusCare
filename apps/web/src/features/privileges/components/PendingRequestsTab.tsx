import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { DataTable } from "../../../components/ui/data-table.js";
import { Button } from "../../../components/ui/button.js";
import { Input } from "../../../components/ui/input.js";
import { Tag } from "../../../components/ui/tag.js";
import type { ColumnDef } from "@tanstack/react-table";
import { usePendingRequests, useReviewRequest } from "../hooks/index.js";
import { approvalLevelVariant, formatDuration } from "../utils/index.js";
import { ReasonDialog } from "./ReasonDialog.js";
import type { TemporaryPermissionRequest } from "../types/index.js";

interface PendingRequestsTabProps {
  active: boolean;
}

export function PendingRequestsTab({ active }: PendingRequestsTabProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePendingRequests({ search, page, pageSize: 8 }, active);
  const { approve, reject } = useReviewRequest();
  const [rejectTarget, setRejectTarget] = useState<TemporaryPermissionRequest | null>(null);

  const columns: ColumnDef<TemporaryPermissionRequest>[] = [
    {
      id: "requester",
      header: "Requester",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-bold text-foreground">
            {row.original.requester.firstName} {row.original.requester.lastName}
          </p>
          <p className="text-[10px] text-muted-foreground">{row.original.requester.email}</p>
        </div>
      ),
    },
    {
      id: "permissions",
      header: "Requested Permissions",
      cell: ({ row }) => (
        <div className="flex max-w-64 flex-wrap gap-1">
          {row.original.items.slice(0, 3).map((item) => (
            <Tag key={item.permissionId} variant="outline">
              {item.permission.displayName}
            </Tag>
          ))}
          {row.original.items.length > 3 && (
            <Tag variant="secondary">+{row.original.items.length - 3}</Tag>
          )}
        </div>
      ),
    },
    {
      id: "level",
      header: "Risk / Duration",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Tag variant={approvalLevelVariant(row.original.approvalLevel)}>
            {row.original.approvalLevel}
          </Tag>
          <span className="text-[11px] font-semibold text-muted-foreground">
            {formatDuration(row.original.durationMinutes)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "reason",
      header: "Justification",
      cell: ({ row }) => (
        <p className="max-w-56 truncate text-[11px] text-muted-foreground" title={row.original.reason}>
          {row.original.reason}
        </p>
      ),
    },
    {
      id: "actions",
      header: "Review",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="xs"
            loading={approve.isPending}
            onClick={() => approve.mutate({ id: row.original.id })}
            className="flex items-center gap-1 border-success/30 text-success hover:bg-success/10"
          >
            <Check className="size-3" />
            Approve
          </Button>
          <Button
            variant="outline"
            size="xs"
            loading={reject.isPending}
            onClick={() => setRejectTarget(row.original)}
            className="flex items-center gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <X className="size-3" />
            Reject
          </Button>
        </div>
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
        placeholder="Search pending requests..."
        className="max-w-64"
        aria-label="Search pending requests"
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        pageIndex={page}
        pageCount={data?.pageCount ?? 1}
        onPageChange={setPage}
        emptyMessage="No temporary access requests awaiting review."
      />

      <ReasonDialog
        open={rejectTarget !== null}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        title="Reject temporary access request"
        description={
          rejectTarget
            ? `Reject the request from ${rejectTarget.requester.firstName} ${rejectTarget.requester.lastName}?`
            : undefined
        }
        confirmLabel="Reject Request"
        destructive
        loading={reject.isPending}
        onConfirm={(note) => {
          if (rejectTarget) reject.mutate({ id: rejectTarget.id, note });
        }}
      />
    </div>
  );
}
