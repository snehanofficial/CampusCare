import React, { useState } from "react";
import { useParams, Link } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Mail,
  Building2,
  Briefcase,
  CircleCheck,
  Clock,
  Ban,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader.js";
import { PageSkeleton } from "@/components/feedback/PageSkeleton.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.js";
import { Button } from "@/components/ui/button.js";
import { Tag } from "@/components/ui/tag.js";
import { StatusBadge } from "@/components/common/StatusBadge.js";
import { StatCard } from "@/components/common/StatCard.js";
import { ConfirmDialog } from "@/components/ui/confirm-dialog.js";
import { userRepository } from "@/lib/repositories/user.repository.js";
import { departmentRepository } from "@/lib/repositories/department.repository.js";
import { ticketRepository } from "@/lib/repositories/ticket.repository.js";
import { usePermission } from "@/hooks/usePermission.js";
import { useAuth } from "@/hooks/useAuth.js";
import {
  useTechnicianOwnAvailability,
  useTechnicianWorkload,
  useClearUnavailability,
  useCountdown,
} from "../hooks/index.js";
import { resolveAvailabilityState, formatRemaining } from "../utils/index.js";
import { SetUnavailabilityDialog } from "../components/SetUnavailabilityDialog.js";

export function TechnicianDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { hasPermission } = usePermission();
  const now = useCountdown(true);

  const [isUnavailDialogOpen, setIsUnavailDialogOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  const canManage = Boolean(
    id && (currentUser?.id === id || currentUser?.role === "SYSTEM_ADMIN" || hasPermission("technicians:manage")),
  );

  const { data: technician, isLoading: techLoading, error: techError } = useQuery({
    queryKey: ["users", id],
    queryFn: () => userRepository.get(id as string),
    enabled: Boolean(id),
  });

  const { data: departments } = useQuery({
    queryKey: ["departments", "all"],
    queryFn: () => departmentRepository.list({ pageSize: 200 }),
  });

  // Self-or-admin read: works whether the viewer is this technician
  // themselves or an admin, unlike the bulk /technicians/availability list
  // (which requires technicians:manage/tickets:assign and would 403 a
  // technician viewing their own page).
  const { data: availability, refetch: refetchAvailability } = useTechnicianOwnAvailability(
    id ?? "",
    Boolean(id) && canManage,
  );

  const { data: workloadMap } = useTechnicianWorkload(id ? [id] : [], Boolean(id));
  const workload = id ? (workloadMap?.[id] ?? 0) : 0;

  const { data: activeTickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["tickets", "by-assignee", id],
    queryFn: () =>
      ticketRepository.list({
        filters: { assigneeId: id },
        pageSize: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    enabled: Boolean(id),
  });

  const clearMutation = useClearUnavailability();

  if (techLoading) return <PageSkeleton />;
  if (techError || !technician) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-8 text-center text-xs text-destructive">
          Could not load this technician.
        </CardContent>
      </Card>
    );
  }

  const departmentName =
    departments?.data.find((d) => d.id === (technician as any).departmentId)?.name ?? "—";
  const isActive = (technician as any).status ? (technician as any).status === "ACTIVE" : ((technician as any).isActive ?? true);
  const state = resolveAvailabilityState({
    isActive,
    isManuallyUnavailable: availability?.isManuallyUnavailable ?? false,
    unavailableUntil: availability?.unavailableUntil ?? null,
    now,
  });

  const openTickets = activeTickets?.data.filter((t) => !["RESOLVED", "CLOSED"].includes(t.status)) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <Link
          to="/technicians"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-3.5" />
          Back to Technicians
        </Link>
        <PageHeader
          title={`${technician.firstName} ${technician.lastName}`}
          description={technician.email}
          badge={
            state === "AVAILABLE" ? (
              <Tag variant="success">Available</Tag>
            ) : state === "TEMPORARILY_UNAVAILABLE" ? (
              <Tag variant="warning">Temporarily Unavailable</Tag>
            ) : (
              <Tag variant="secondary">Inactive</Tag>
            )
          }
          actions={
            canManage ? (
              state === "TEMPORARILY_UNAVAILABLE" ? (
                <>
                  <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setIsUnavailDialogOpen(true)}>
                    <Clock className="size-3.5 mr-1" />
                    Extend
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 text-success border-success/30 hover:bg-success/10"
                    onClick={() => setIsConfirmClearOpen(true)}
                  >
                    <CircleCheck className="size-3.5 mr-1" />
                    Cancel Unavailability
                  </Button>
                </>
              ) : (
                isActive && (
                  <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setIsUnavailDialogOpen(true)}>
                    <Ban className="size-3.5 mr-1" />
                    Mark Unavailable
                  </Button>
                )
              )
            ) : undefined
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Active Workload" value={workload} description="open tickets" icon={Briefcase} />
        <StatCard
          title="Availability"
          value={state === "AVAILABLE" ? "Available" : state === "TEMPORARILY_UNAVAILABLE" ? "Unavailable" : "Inactive"}
          description={
            state === "TEMPORARILY_UNAVAILABLE" ? `Until ${formatRemaining(availability?.unavailableUntil ?? null, now)}` : undefined
          }
          icon={state === "AVAILABLE" ? CircleCheck : state === "TEMPORARILY_UNAVAILABLE" ? Clock : Ban}
        />
        <StatCard title="Department" value={departmentName} icon={Building2} />
        <StatCard title="Account Status" value={isActive ? "Active" : "Inactive"} icon={Mail} />
      </div>

      {state === "TEMPORARILY_UNAVAILABLE" && availability?.reason && (
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-3 text-xs text-foreground">
            <span className="font-bold">Reason:</span> {availability.reason}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xs">Active Tickets ({openTickets.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ticketsLoading ? (
            <div className="p-4">
              <PageSkeleton />
            </div>
          ) : openTickets.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground">No active tickets currently assigned.</p>
          ) : (
            <ul className="divide-y divide-border">
              {openTickets.map((t) => (
                <li key={t.id} className="p-3 flex items-center justify-between gap-3">
                  <Link to={`/tickets/${t.id}`} className="min-w-0 flex-1 hover:underline">
                    <p className="text-xs font-bold text-foreground truncate">{t.title}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{t.ticketNumber}</p>
                  </Link>
                  <StatusBadge type="status" value={t.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {id && (
        <SetUnavailabilityDialog
          isOpen={isUnavailDialogOpen}
          onClose={() => setIsUnavailDialogOpen(false)}
          technicianId={id}
          technicianName={`${technician.firstName} ${technician.lastName}`}
          currentUnavailableUntil={availability?.unavailableUntil ?? null}
        />
      )}

      <ConfirmDialog
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        onConfirm={() => {
          if (!id) return;
          clearMutation.mutate(id, {
            onSuccess: () => {
              setIsConfirmClearOpen(false);
              void refetchAvailability();
              void queryClient.invalidateQueries({ queryKey: ["technicians"] });
            },
          });
        }}
        title="Cancel unavailability?"
        description={`${technician.firstName} will immediately become eligible for new ticket assignments again.`}
        confirmText="Cancel Unavailability"
        isConfirming={clearMutation.isPending}
      />
    </div>
  );
}
export default TechnicianDetailPage;
