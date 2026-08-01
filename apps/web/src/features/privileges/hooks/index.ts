import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  privilegeRepository,
  type CreateRequestPayload,
  type GrantAccessPayload,
  type PolicyUpdatePayload,
  type PrivilegeListParams,
  type TemplatePayload,
} from "../../../lib/repositories/privilege.repository.js";

export const PRIVILEGE_KEYS = {
  registry: ["permission-registry"] as const,
  pending: (params?: PrivilegeListParams) => ["privileges", "pending", params] as const,
  active: (params?: PrivilegeListParams) => ["privileges", "active", params] as const,
  history: (params?: PrivilegeListParams) => ["privileges", "history", params] as const,
  my: (params?: PrivilegeListParams) => ["privileges", "my", params] as const,
  effective: ["privileges", "effective"] as const,
  templates: ["privileges", "templates"] as const,
  policies: ["privileges", "policies"] as const,
};

function useInvalidatePrivileges() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["privileges"] });
  };
}

function toMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

// ─── Reads ─────────────────────────────────────────────────────────────────────

export function usePermissionRegistry(enabled = true) {
  return useQuery({
    queryKey: PRIVILEGE_KEYS.registry,
    queryFn: () => privilegeRepository.getPermissionRegistry(),
    enabled,
    staleTime: 5 * 60_000, // the registry is effectively static within a session
  });
}

export function usePendingRequests(params: PrivilegeListParams, enabled = true) {
  return useQuery({
    queryKey: PRIVILEGE_KEYS.pending(params),
    queryFn: () => privilegeRepository.listPending(params),
    enabled,
  });
}

export function useActiveGrants(params: PrivilegeListParams, enabled = true) {
  return useQuery({
    queryKey: PRIVILEGE_KEYS.active(params),
    queryFn: () => privilegeRepository.listActive(params),
    enabled,
    refetchInterval: enabled ? 60_000 : false,
  });
}

export function useGrantHistory(params: PrivilegeListParams, enabled = true) {
  return useQuery({
    queryKey: PRIVILEGE_KEYS.history(params),
    queryFn: () => privilegeRepository.listHistory(params),
    enabled,
  });
}

export function useMyRequests(params: PrivilegeListParams, enabled = true) {
  return useQuery({
    queryKey: PRIVILEGE_KEYS.my(params),
    queryFn: () => privilegeRepository.listMyRequests(params),
    enabled,
  });
}

export function useTemplates(enabled = true) {
  return useQuery({
    queryKey: PRIVILEGE_KEYS.templates,
    queryFn: () => privilegeRepository.listTemplates(),
    enabled,
  });
}

export function useApprovalPolicies(enabled = true) {
  return useQuery({
    queryKey: PRIVILEGE_KEYS.policies,
    queryFn: () => privilegeRepository.listPolicies(),
    enabled,
  });
}

/**
 * Polls the caller's live temporary permissions. Drives the navbar indicator
 * and gives the client a cheap `permissionsVersion` signal it can use to know
 * its cached permission snapshot has gone stale.
 */
export function useEffectivePrivileges(enabled = true) {
  return useQuery({
    queryKey: PRIVILEGE_KEYS.effective,
    queryFn: () => privilegeRepository.getMyEffective(),
    enabled,
    refetchInterval: enabled ? 30_000 : false,
    refetchOnWindowFocus: true,
    retry: false,
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateRequest() {
  const invalidate = useInvalidatePrivileges();
  return useMutation({
    mutationFn: (payload: CreateRequestPayload) => privilegeRepository.createRequest(payload),
    onSuccess: () => {
      toast.success("Temporary access request submitted for review.");
      invalidate();
    },
    onError: (err) => toast.error(toMessage(err, "Failed to submit request.")),
  });
}

export function useGrantAccess() {
  const invalidate = useInvalidatePrivileges();
  return useMutation({
    mutationFn: (payload: GrantAccessPayload) => privilegeRepository.grant(payload),
    onSuccess: () => {
      toast.success("Temporary access granted.");
      invalidate();
    },
    onError: (err) => toast.error(toMessage(err, "Failed to grant temporary access.")),
  });
}

export function useReviewRequest() {
  const invalidate = useInvalidatePrivileges();

  const approve = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      privilegeRepository.approve(id, note),
    onSuccess: () => {
      toast.success("Request approved and access activated.");
      invalidate();
    },
    onError: (err) => toast.error(toMessage(err, "Failed to approve request.")),
  });

  const reject = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      privilegeRepository.reject(id, note),
    onSuccess: () => {
      toast.success("Request rejected.");
      invalidate();
    },
    onError: (err) => toast.error(toMessage(err, "Failed to reject request.")),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => privilegeRepository.cancel(id),
    onSuccess: () => {
      toast.success("Request cancelled.");
      invalidate();
    },
    onError: (err) => toast.error(toMessage(err, "Failed to cancel request.")),
  });

  return { approve, reject, cancel };
}

export function useRevokeGrant() {
  const invalidate = useInvalidatePrivileges();
  return useMutation({
    mutationFn: ({ grantId, reason }: { grantId: string; reason: string }) =>
      privilegeRepository.revoke(grantId, reason),
    onSuccess: () => {
      toast.success("Temporary access revoked.");
      invalidate();
    },
    onError: (err) => toast.error(toMessage(err, "Failed to revoke access.")),
  });
}

export function useTemplateMutations() {
  const invalidate = useInvalidatePrivileges();

  const create = useMutation({
    mutationFn: (payload: TemplatePayload) => privilegeRepository.createTemplate(payload),
    onSuccess: () => {
      toast.success("Template created.");
      invalidate();
    },
    onError: (err) => toast.error(toMessage(err, "Failed to create template.")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => privilegeRepository.deleteTemplate(id),
    onSuccess: () => {
      toast.success("Template deactivated.");
      invalidate();
    },
    onError: (err) => toast.error(toMessage(err, "Failed to deactivate template.")),
  });

  return { create, remove };
}

export function useUpdatePolicy() {
  const invalidate = useInvalidatePrivileges();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PolicyUpdatePayload }) =>
      privilegeRepository.updatePolicy(id, payload),
    onSuccess: () => {
      toast.success("Approval policy updated.");
      invalidate();
    },
    onError: (err) => toast.error(toMessage(err, "Failed to update approval policy.")),
  });
}

/**
 * A single shared 1-second ticker.
 * Countdown cells subscribe to this rather than each running their own interval,
 * so a 100-row table still costs exactly one timer.
 */
export function useCountdown(active = true): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  return now;
}
