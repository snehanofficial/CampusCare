import React, { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "../../../components/ui/data-table.js";
import { Button } from "../../../components/ui/button.js";
import { Input } from "../../../components/ui/input.js";
import { Tag } from "../../../components/ui/tag.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.js";
import type { ColumnDef } from "@tanstack/react-table";
import { privilegeRepository } from "../../../lib/repositories/privilege.repository.js";
import { useGrantHistory } from "../hooks/index.js";
import { downloadBlob, formatDuration, grantStatusVariant } from "../utils/index.js";
import type { TemporaryGrant } from "../types/index.js";

interface HistoryTabProps {
  active: boolean;
}

const STATUS_OPTIONS = ["ACTIVE", "EXPIRED", "REVOKED"] as const;

export function HistoryTab({ active }: HistoryTabProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const params = { search, status: status || undefined, page, pageSize: 8 };
  const { data, isLoading } = useGrantHistory(params, active);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await privilegeRepository.exportHistoryCsv({ search, status: status || undefined });
      downloadBlob(blob, "temporary-access-history.csv");
      toast.success("History exported.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export history.");
    } finally {
      setExporting(false);
    }
  };

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
        <span className="font-mono text-[11px] text-foreground">
          {row.original.permission.code}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Tag variant={grantStatusVariant(row.original.status)}>{row.original.status}</Tag>
      ),
    },
    {
      id: "source",
      header: "Source",
      cell: ({ row }) => (
        <span className="text-[10px] font-semibold text-muted-foreground">
          {row.original.source.replace("GTPE_", "")}
        </span>
      ),
    },
    {
      id: "duration",
      header: "Duration",
      cell: ({ row }) => (
        <span className="text-[11px] text-muted-foreground">
          {formatDuration(row.original.durationMinutes)}
        </span>
      ),
    },
    {
      id: "granted",
      header: "Granted At",
      cell: ({ row }) => (
        <span className="text-[11px] text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      id: "reason",
      header: "Reason",
      cell: ({ row }) => {
        const text = row.original.revokeReason ?? row.original.reason ?? "—";
        return (
          <p className="max-w-48 truncate text-[11px] text-muted-foreground" title={text}>
            {text}
          </p>
        );
      },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search history..."
          className="max-w-56"
          aria-label="Search grant history"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v === "ALL" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="xs"
          loading={exporting}
          onClick={() => void handleExport()}
          className="flex items-center gap-1"
        >
          <Download className="size-3" />
          Export CSV
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        pageIndex={page}
        pageCount={data?.pageCount ?? 1}
        onPageChange={setPage}
        emptyMessage="No temporary access history yet."
      />
    </div>
  );
}
