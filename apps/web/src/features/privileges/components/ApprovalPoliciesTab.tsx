import React from "react";
import { DataTable } from "../../../components/ui/data-table.js";
import { Tag } from "../../../components/ui/tag.js";
import { Switch } from "../../../components/ui/switch.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.js";
import type { ColumnDef } from "@tanstack/react-table";
import { useApprovalPolicies, useUpdatePolicy } from "../hooks/index.js";
import { approvalLevelVariant, formatDuration } from "../utils/index.js";
import type { ApprovalPolicy } from "../types/index.js";

interface ApprovalPoliciesTabProps {
  active: boolean;
}

const APPROVAL_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const APPROVER_ROLES = ["DEPT_ADMIN", "SYSTEM_ADMIN"] as const;
const DURATION_OPTIONS = [30, 60, 120, 240, 480, 1440];

export function ApprovalPoliciesTab({ active }: ApprovalPoliciesTabProps) {
  const { data, isLoading } = useApprovalPolicies(active);
  const updatePolicy = useUpdatePolicy();

  const columns: ColumnDef<ApprovalPolicy>[] = [
    {
      id: "scope",
      header: "Scope",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-bold text-foreground">
            {row.original.permission?.displayName ?? row.original.permissionCategory}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {row.original.permissionId ? "Single permission" : "Whole category"}
          </p>
        </div>
      ),
    },
    {
      id: "level",
      header: "Risk Level",
      cell: ({ row }) => (
        <Select
          value={row.original.approvalLevel}
          onValueChange={(approvalLevel) =>
            updatePolicy.mutate({ id: row.original.id, payload: { approvalLevel } })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPROVAL_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      id: "approver",
      header: "Required Approver",
      cell: ({ row }) => (
        <Select
          value={row.original.approverRole}
          onValueChange={(approverRole) =>
            updatePolicy.mutate({ id: row.original.id, payload: { approverRole } })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPROVER_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      id: "maxDuration",
      header: "Max Duration",
      cell: ({ row }) => (
        <Select
          value={String(row.original.maxDurationMinutes)}
          onValueChange={(value) =>
            updatePolicy.mutate({
              id: row.original.id,
              payload: { maxDurationMinutes: Number(value) },
            })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map((minutes) => (
              <SelectItem key={minutes} value={String(minutes)}>
                {formatDuration(minutes)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      id: "isActive",
      header: "Enabled",
      cell: ({ row }) => (
        <Switch
          checked={row.original.isActive}
          onCheckedChange={(isActive) =>
            updatePolicy.mutate({ id: row.original.id, payload: { isActive } })
          }
          aria-label="Toggle policy"
        />
      ),
    },
    {
      id: "effective",
      header: "Effective",
      cell: ({ row }) => (
        <Tag variant={approvalLevelVariant(row.original.approvalLevel)}>
          {row.original.isActive ? "Enforced" : "Disabled"}
        </Tag>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">
        Policies resolve most-specific-first: an exact permission rule wins over its category
        rule, and a hardcoded fallback (LOW / DEPT_ADMIN / 1 hour) applies when neither matches.
        Across a multi-permission request, the strictest matching policy is applied.
      </p>
      <DataTable
        columns={columns}
        data={data ?? []}
        loading={isLoading}
        pageCount={1}
        emptyMessage="No approval policies configured."
      />
    </div>
  );
}
