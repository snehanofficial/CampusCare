import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldPlus } from "lucide-react";
import { Button } from "../../../components/ui/button.js";
import { Textarea } from "../../../components/ui/textarea.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.js";
import { userRepository } from "../../../lib/repositories/user.repository.js";
import { PermissionSelector } from "./PermissionSelector.js";
import { DurationPicker } from "./DurationPicker.js";
import { TemplatePicker } from "./TemplatePicker.js";
import { useGrantAccess } from "../hooks/index.js";
import { grantFormSchema, type GrantFormValues } from "../schemas/index.js";
import type { PermissionTemplate } from "../types/index.js";

interface GrantAccessTabProps {
  active: boolean;
  /** Custom durations are exposed to System Administrators only. */
  isSystemAdmin: boolean;
}

const INITIAL: GrantFormValues = {
  userId: "",
  permissionIds: [],
  durationMinutes: 60,
  reason: "",
  templateId: null,
};

export function GrantAccessTab({ active, isSystemAdmin }: GrantAccessTabProps) {
  const [form, setForm] = useState<GrantFormValues>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const grant = useGrantAccess();

  const { data: users } = useQuery({
    queryKey: ["users", "privilege-grant-targets"],
    queryFn: () => userRepository.list({ pageSize: 100 }),
    enabled: active,
  });

  const patch = (next: Partial<GrantFormValues>) => setForm((prev) => ({ ...prev, ...next }));

  const applyTemplate = (template: PermissionTemplate | null) => {
    if (!template) {
      patch({ templateId: null });
      return;
    }
    // Pre-fills, but everything stays editable afterwards.
    patch({
      templateId: template.id,
      permissionIds: template.items.map((i) => i.permissionId),
      durationMinutes: template.defaultDurationMinutes,
    });
  };

  const handleSubmit = () => {
    const parsed = grantFormSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    grant.mutate(parsed.data, { onSuccess: () => setForm(INITIAL) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-foreground">Target User</label>
        <Select value={form.userId} onValueChange={(v) => patch({ userId: v })}>
          <SelectTrigger className="max-w-md">
            <SelectValue placeholder="Select a user to grant access to" />
          </SelectTrigger>
          <SelectContent>
            {(users?.data ?? []).map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.firstName} {user.lastName} — {user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.userId && (
          <p className="text-[10px] font-semibold text-destructive">{errors.userId}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-foreground">
          Start from a Template <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <TemplatePicker
          selectedTemplateId={form.templateId ?? null}
          onApply={applyTemplate}
          enabled={active}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-foreground">Permissions</label>
        <PermissionSelector
          value={form.permissionIds}
          onChange={(permissionIds) => patch({ permissionIds })}
          enabled={active}
          error={errors.permissionIds}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-foreground">Duration</label>
        <DurationPicker
          value={form.durationMinutes}
          onChange={(durationMinutes) => patch({ durationMinutes })}
          allowCustom={isSystemAdmin}
          error={errors.durationMinutes}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-foreground">Justification</label>
        <Textarea
          value={form.reason}
          onChange={(e) => patch({ reason: e.target.value })}
          placeholder="Why does this user need elevated access? This is recorded in the audit log."
          rows={3}
        />
        {errors.reason && (
          <p className="text-[10px] font-semibold text-destructive">{errors.reason}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          variant="primary"
          size="sm"
          loading={grant.isPending}
          onClick={handleSubmit}
          className="flex items-center gap-1.5"
        >
          <ShieldPlus className="size-3.5" />
          Grant Temporary Access
        </Button>
      </div>
    </div>
  );
}
