import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  technicianRepository,
  type SetUnavailabilityPayload,
} from "../../../lib/repositories/technician.repository.js";

export const TECHNICIAN_KEYS = {
  eligible: (departmentId: string) => ["technicians", "eligible", departmentId] as const,
  availability: (departmentId?: string) => ["technicians", "availability", departmentId] as const,
  workload: (ids: string[]) => ["technicians", "workload", ids.slice().sort().join(",")] as const,
};

function useInvalidateTechnicians() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["technicians"] });
    // Availability/workload changes can change who a ticket should be
    // assigned to, and manual (re)assignment changes workload — keep the
    // ticket list/detail views (which also render assignee info) in sync.
    void queryClient.invalidateQueries({ queryKey: ["tickets"] });
  };
}

function toMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

// ─── Reads ─────────────────────────────────────────────────────────────────────
// All read hooks poll on an interval, same as privileges' useActiveGrants /
// useEffectivePrivileges — the backend scheduler is the sole authority on when
// unavailability expires; the UI only ever reflects what it reports, never a
// frontend-computed timer.

export function useEligibleTechnicians(departmentId: string, enabled = true) {
  return useQuery({
    queryKey: TECHNICIAN_KEYS.eligible(departmentId),
    queryFn: () => technicianRepository.listEligible(departmentId),
    enabled: enabled && Boolean(departmentId),
    refetchInterval: enabled ? 30_000 : false,
  });
}

/** Self-or-admin single-technician read — safe to call from a technician's own detail page. */
export function useTechnicianOwnAvailability(technicianId: string, enabled = true) {
  return useQuery({
    queryKey: ["technicians", "availability-one", technicianId],
    queryFn: () => technicianRepository.getAvailabilityForOne(technicianId),
    enabled: enabled && Boolean(technicianId),
    refetchInterval: enabled ? 30_000 : false,
  });
}

export function useTechnicianAvailability(departmentId?: string, enabled = true) {
  return useQuery({
    queryKey: TECHNICIAN_KEYS.availability(departmentId),
    queryFn: () => technicianRepository.listAvailability(departmentId),
    enabled,
    refetchInterval: enabled ? 30_000 : false,
  });
}

export function useTechnicianWorkload(technicianIds: string[], enabled = true) {
  return useQuery({
    queryKey: TECHNICIAN_KEYS.workload(technicianIds),
    queryFn: () => technicianRepository.getWorkload(technicianIds),
    enabled: enabled && technicianIds.length > 0,
    refetchInterval: enabled ? 30_000 : false,
  });
}

/** Local 1-second ticker for live countdown labels — display only, never authoritative. */
export function useCountdown(active = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useSetUnavailability() {
  const invalidate = useInvalidateTechnicians();
  return useMutation({
    mutationFn: ({ technicianId, payload }: { technicianId: string; payload: SetUnavailabilityPayload }) =>
      technicianRepository.setUnavailability(technicianId, payload),
    onSuccess: () => {
      toast.success("Availability updated.");
      invalidate();
    },
    onError: (err) => toast.error(toMessage(err, "Failed to update availability.")),
  });
}

export function useClearUnavailability() {
  const invalidate = useInvalidateTechnicians();
  return useMutation({
    mutationFn: (technicianId: string) => technicianRepository.clearUnavailability(technicianId),
    onSuccess: () => {
      toast.success("Marked available again.");
      invalidate();
    },
    onError: (err) => toast.error(toMessage(err, "Failed to clear unavailability.")),
  });
}

export function useAutoAssign() {
  const invalidate = useInvalidateTechnicians();
  return useMutation({
    mutationFn: (ticketId: string) => technicianRepository.autoAssign(ticketId),
    onSuccess: (result) => {
      if (result.assigneeId) {
        toast.success("Ticket automatically assigned to the best available technician.");
      } else {
        toast.warning("No eligible technician was available — ticket left unassigned.");
      }
      invalidate();
    },
    onError: (err) => toast.error(toMessage(err, "Automatic assignment failed.")),
  });
}
