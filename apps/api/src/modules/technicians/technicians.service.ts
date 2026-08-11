import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { TechniciansRepository, OPEN_TICKET_STATUSES } from "./technicians.repository.js";
import { TECH_ACTIONS, writeAudit, notify } from "./technicians.events.js";
import { eventBus } from "../../utils/event-bus.js";
import { logger } from "../../utils/logger.js";
import { BadRequestError, NotFoundError } from "../../utils/errors.js";
import type { SetUnavailabilityInput } from "./technicians.schema.js";

export interface ActorContext {
  id: string;
  role: string;
}

export interface EligibleTechnician {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  workload: number;
}

function isCurrentlyUnavailable(
  availability: { isManuallyUnavailable: boolean; unavailableUntil: Date | null } | null,
  now: Date,
): boolean {
  if (!availability || !availability.isManuallyUnavailable) return false;
  // Defensive: treat an unexpired manual-unavailability row as unavailable even
  // if the scheduler hasn't ticked yet; an *expired* one (past unavailableUntil)
  // is treated as available immediately, without waiting for the sweep — the
  // sweep exists to clear the flag for the UI/history, not to gate eligibility.
  if (availability.unavailableUntil && availability.unavailableUntil.getTime() <= now.getTime()) {
    return false;
  }
  return true;
}

export class TechniciansService {
  // ── Eligibility + workload (read-only, used for UI/preview and by the
  // assignment transaction below — the transaction re-derives this itself
  // under Serializable isolation rather than trusting this snapshot) ──────────
  static async getEligibleWithWorkload(departmentId: string): Promise<EligibleTechnician[]> {
    const now = new Date();
    const candidates = await TechniciansRepository.findEligibleCandidates(departmentId);
    const available = candidates.filter((c) => !isCurrentlyUnavailable(c.technicianAvailability, now));
    const workloads = await TechniciansRepository.getWorkloadCounts(available.map((c) => c.id));

    return available
      .map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        workload: workloads.get(c.id) ?? 0,
      }))
      .sort((a, b) => a.workload - b.workload || a.id.localeCompare(b.id));
  }

  // Department-agnostic workload lookup for an arbitrary set of technician
  // ids — used by the frontend's technician roster view, which (unlike
  // getEligibleWithWorkload) must show workload for *every* technician,
  // including currently-unavailable ones, not just eligible candidates for
  // one department. Reuses the same repository aggregation — no second
  // workload calculation exists anywhere else.
  static async getWorkloadForIds(technicianIds: string[]): Promise<Record<string, number>> {
    const workloads = await TechniciansRepository.getWorkloadCounts(technicianIds);
    return Object.fromEntries(workloads);
  }

  static async getAvailabilityFor(technicianId: string) {
    return TechniciansRepository.getAvailability(technicianId);
  }

  static async listTeamAvailability(departmentId?: string) {
    const rows = await TechniciansRepository.listAvailability(departmentId);
    return rows.map((r) => ({
      technicianId: r.technicianId,
      technician: r.technician,
      isManuallyUnavailable: r.isManuallyUnavailable,
      unavailableUntil: r.unavailableUntil?.toISOString() ?? null,
      reason: r.reason,
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  // ── Availability management ─────────────────────────────────────────────────
  // A technician may always manage their own availability; anyone else needs
  // technicians:manage. Deliberately does NOT touch User.isActive.
  // Authorization (self, or technicians:manage for acting on someone else) is
  // enforced by the caller (technicians.controller.ts), which has access to
  // req.user.permissions — this service only trusts a pre-authorized actor.
  static async setUnavailability(actor: ActorContext, technicianId: string, input: SetUnavailabilityInput) {
    const technician = await prisma.user.findUnique({
      where: { id: technicianId },
      select: { id: true, role: { select: { name: true } }, isActive: true },
    });
    if (!technician || technician.role.name !== "TECHNICIAN") {
      throw new NotFoundError("Technician not found");
    }

    const before = await TechniciansRepository.getAvailability(technicianId);
    const updated = await TechniciansRepository.upsertAvailability(technicianId, {
      isManuallyUnavailable: true,
      unavailableUntil: input.unavailableUntil,
      reason: input.reason ?? null,
      setById: actor.id,
    });

    await writeAudit({
      action: TECH_ACTIONS.SET_UNAVAILABLE,
      targetTable: "technician_availability",
      targetId: technicianId,
      oldValue: before ? { isManuallyUnavailable: before.isManuallyUnavailable, unavailableUntil: before.unavailableUntil } : null,
      newValue: { isManuallyUnavailable: true, unavailableUntil: updated.unavailableUntil },
      performedById: actor.id,
    });

    if (actor.id !== technicianId) {
      await notify({
        userIds: [technicianId],
        title: "Marked unavailable for assignment",
        message: `An administrator marked you temporarily unavailable for new ticket assignments until ${updated.unavailableUntil?.toLocaleString()}.`,
        type: "INFO",
      });
    }

    return updated;
  }

  static async clearUnavailability(actor: ActorContext, technicianId: string) {
    const technician = await prisma.user.findUnique({
      where: { id: technicianId },
      select: { id: true, role: { select: { name: true } } },
    });
    if (!technician || technician.role.name !== "TECHNICIAN") {
      throw new NotFoundError("Technician not found");
    }

    const before = await TechniciansRepository.getAvailability(technicianId);
    await TechniciansRepository.clearUnavailability(before ? [before.id] : []);

    await writeAudit({
      action: TECH_ACTIONS.CLEAR_UNAVAILABLE,
      targetTable: "technician_availability",
      targetId: technicianId,
      oldValue: before ? { isManuallyUnavailable: before.isManuallyUnavailable, unavailableUntil: before.unavailableUntil } : null,
      newValue: { isManuallyUnavailable: false, unavailableUntil: null },
      performedById: actor.id,
    });

    return { cleared: true };
  }

  // ── Automatic expiry sweep (called by technicians.scheduler.ts) ────────────
  static async expireStaleUnavailability(now: Date = new Date()): Promise<number> {
    const expired = await TechniciansRepository.findExpiredUnavailability(now);
    if (expired.length === 0) return 0;

    await TechniciansRepository.clearUnavailability(expired.map((e) => e.id));

    for (const row of expired) {
      await writeAudit({
        action: TECH_ACTIONS.AUTO_EXPIRE_UNAVAILABLE,
        targetTable: "technician_availability",
        targetId: row.technicianId,
        oldValue: { isManuallyUnavailable: true, unavailableUntil: row.unavailableUntil },
        newValue: { isManuallyUnavailable: false, unavailableUntil: null },
        // Scheduler-driven; attribute to the technician themselves for traceability
        // (same convention as GTPE-EXPIRE attributing to the grantor/self).
        performedById: row.technicianId,
      });
    }

    await notify({
      userIds: expired.map((e) => e.technicianId),
      title: "Availability restored",
      message: "Your temporary unavailability period has ended — you're eligible for new ticket assignments again.",
      type: "INFO",
    });

    return expired.length;
  }

  // ── Deterministic selection ─────────────────────────────────────────────────
  // Lowest live open-ticket workload wins; ties broken by technician id so the
  // result is fully deterministic (never depends on map/array iteration order).
  private static pickLowestWorkload(
    candidates: { id: string }[],
    workloads: Map<string, number>,
  ): string | null {
    if (candidates.length === 0) return null;
    let best = candidates[0]!;
    let bestLoad = workloads.get(best.id) ?? 0;
    for (const c of candidates.slice(1)) {
      const load = workloads.get(c.id) ?? 0;
      if (load < bestLoad || (load === bestLoad && c.id < best.id)) {
        best = c;
        bestLoad = load;
      }
    }
    return best.id;
  }

  // ── Automatic assignment ────────────────────────────────────────────────────
  // Race-safe: the eligibility read, workload read, and assignment write all
  // happen inside one Serializable transaction. If two tickets are assigned
  // concurrently and would otherwise both pick the same "least loaded"
  // technician, Postgres aborts one with a serialization failure (P2034) and
  // we retry — the loser re-reads workload (now reflecting the winner's
  // assignment) and picks correctly on retry, instead of silently overloading
  // one technician.
  static async autoAssignTicket(ticketId: string, performedById?: string): Promise<{ assigneeId: string | null }> {
    const MAX_ATTEMPTS = 8;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const result = await prisma.$transaction(
          async (tx) => {
            const ticket = await tx.ticket.findUnique({ where: { id: ticketId } });
            if (!ticket) throw new NotFoundError("Ticket not found");
            if (ticket.assigneeId) {
              // Already assigned (e.g. by a manual override that landed first) — no-op.
              return { assigneeId: ticket.assigneeId, alreadyAssigned: true, ticket };
            }

            const now = new Date();
            const candidates = await tx.user.findMany({
              where: { isActive: true, departmentId: ticket.departmentId, role: { name: "TECHNICIAN" } },
              select: { id: true, technicianAvailability: true },
            });
            const eligible = candidates.filter((c) => !isCurrentlyUnavailable(c.technicianAvailability, now));

            if (eligible.length === 0) {
              return { assigneeId: null, alreadyAssigned: false, ticket };
            }

            const grouped = await tx.ticket.groupBy({
              by: ["assigneeId"],
              where: { assigneeId: { in: eligible.map((e) => e.id) }, status: { in: [...OPEN_TICKET_STATUSES] } },
              _count: { _all: true },
            });
            const workloads = new Map<string, number>(eligible.map((e) => [e.id, 0]));
            for (const row of grouped) {
              if (row.assigneeId) workloads.set(row.assigneeId, row._count._all);
            }

            const chosenId = this.pickLowestWorkload(eligible, workloads);
            if (!chosenId) return { assigneeId: null, alreadyAssigned: false, ticket };

            const updated = await tx.ticket.update({
              where: { id: ticketId },
              data: {
                assignee: { connect: { id: chosenId } },
                status: ticket.status === "OPEN" ? "ASSIGNED" : ticket.status,
              },
            });

            return { assigneeId: chosenId, alreadyAssigned: false, ticket: updated };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        if (result.alreadyAssigned || !result.assigneeId) {
          if (!result.assigneeId) {
            await writeAudit({
              action: TECH_ACTIONS.AUTO_ASSIGN_FAILED,
              targetTable: "tickets",
              targetId: ticketId,
              newValue: { reason: "No eligible technician found" },
              performedById: performedById ?? result.ticket.creatorId,
            });
          }
          return { assigneeId: result.assigneeId };
        }

        // Side effects run after the transaction commits — never inside it —
        // so a rollback/retry can never produce a duplicate notification or
        // audit entry (same principle as ASSET-001's asset.assigned publish).
        await writeAudit({
          action: TECH_ACTIONS.AUTO_ASSIGN,
          targetTable: "tickets",
          targetId: ticketId,
          oldValue: { assigneeId: null },
          newValue: { assigneeId: result.assigneeId },
          performedById: performedById ?? result.assigneeId,
        });

        eventBus.publish("ticket.assigned", {
          ticketId,
          ticketNumber: result.ticket.ticketNumber,
          assigneeId: result.assigneeId,
          title: result.ticket.title,
        });

        return { assigneeId: result.assigneeId };
      } catch (err: any) {
        // Prisma 7's driver-adapter engine (@prisma/adapter-pg) surfaces a
        // Postgres serialization failure as a DriverAdapterError whose `cause`
        // carries the real Postgres SQLSTATE (40001), NOT the classic
        // PrismaClientKnownRequestError P2034 code from the legacy query
        // engine — confirmed live under real concurrent load (4 simultaneous
        // auto-assign calls); checking P2034 alone silently missed every
        // conflict and surfaced as an uncaught 500. Check both so this keeps
        // working if the underlying engine/adapter changes again.
        const sqlState = err?.cause?.originalCode ?? err?.meta?.code;
        const isSerializationFailure = err?.code === "P2034" || sqlState === "40001";
        if (isSerializationFailure && attempt < MAX_ATTEMPTS) {
          // Jittered backoff so N-way contention doesn't just re-collide
          // immediately on every retry (confirmed live: a fixed zero-delay
          // retry with only 4 attempts still lost 2 of 6 concurrent requests
          // to repeat collisions under heavier contention).
          const backoffMs = 10 * attempt + Math.floor(Math.random() * 20);
          logger.warn({ ticketId, attempt, backoffMs }, "TechniciansService.autoAssignTicket: serialization conflict, retrying");
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }
        if (err instanceof NotFoundError) throw err;
        logger.error({ err, ticketId, attempt }, "TechniciansService.autoAssignTicket: failed");
        throw err;
      }
    }
    throw new BadRequestError("Could not assign ticket after multiple concurrent attempts — please retry");
  }
}

export default TechniciansService;
