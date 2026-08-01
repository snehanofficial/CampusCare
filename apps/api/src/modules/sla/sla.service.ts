import { SlaRepository } from "./sla.repository.js";
import { CreateSlaPolicyInput, UpdateSlaPolicyInput } from "./sla.schema.js";
import { NotFoundError, ConflictError } from "../../utils/errors.js";
import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";
import { Prisma } from "@prisma/client";

// Default SLA limits in minutes if DB policies aren't found
const DEFAULT_LIMITS: Record<string, number> = {
  LOW: 2880,      // 48 hours
  MEDIUM: 1440,   // 24 hours
  HIGH: 240,      // 4 hours
  CRITICAL: 120,  // 2 hours
};

function formatPolicy(p: any) {
  return {
    id: p.id,
    priority: p.priority,
    displayName: p.displayName,
    responseTimeLimit: p.responseTimeLimit,
    resolveTimeLimit: p.resolveTimeLimit,
    escalationRoleName: p.escalationRoleName,
    warningThreshold: p.warningThreshold,
    color: p.color ?? null,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export class SlaService {
  // ─── SLA Policies CRUD ──────────────────────────────────────────────────────
  static async listPolicies(params: { isActive?: string }) {
    logger.debug({ params }, "SlaService.listPolicies");
    const where: Prisma.SlaPolicyWhereInput = {};
    if (params.isActive === "true") where.isActive = true;
    if (params.isActive === "false") where.isActive = false;

    const policies = await SlaRepository.findMany({ where });
    return {
      data: policies.map(formatPolicy),
      total: policies.length,
    };
  }

  static async getPolicyById(id: string) {
    logger.debug(`SlaService.getPolicyById: ${id}`);
    const policy = await SlaRepository.findById(id);
    if (!policy) throw new NotFoundError("SLA Policy not found");
    return formatPolicy(policy);
  }

  static async createPolicy(input: CreateSlaPolicyInput) {
    logger.debug({ priority: input.priority }, "SlaService.createPolicy");

    const existing = await SlaRepository.findByPriority(input.priority);
    if (existing) throw new ConflictError(`SLA Policy for priority ${input.priority} already exists`);

    const policy = await SlaRepository.create({
      priority: input.priority,
      displayName: input.displayName,
      responseTimeLimit: input.responseTimeLimit,
      resolveTimeLimit: input.resolveTimeLimit,
      escalationRoleName: input.escalationRoleName ?? "DEPT_ADMIN",
      warningThreshold: input.warningThreshold ?? 80,
      color: input.color ?? null,
      isActive: input.isActive ?? true,
    });

    return formatPolicy(policy);
  }

  static async updatePolicy(id: string, input: UpdateSlaPolicyInput) {
    logger.debug({ id }, "SlaService.updatePolicy");
    const existing = await SlaRepository.findById(id);
    if (!existing) throw new NotFoundError("SLA Policy not found");

    const data: Prisma.SlaPolicyUpdateInput = {};
    if (input.displayName !== undefined) data.displayName = input.displayName;
    if (input.responseTimeLimit !== undefined) data.responseTimeLimit = input.responseTimeLimit;
    if (input.resolveTimeLimit !== undefined) data.resolveTimeLimit = input.resolveTimeLimit;
    if (input.escalationRoleName !== undefined) data.escalationRoleName = input.escalationRoleName;
    if (input.warningThreshold !== undefined) data.warningThreshold = input.warningThreshold;
    if (input.color !== undefined) data.color = input.color ?? null;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const updated = await SlaRepository.update(id, data);
    return formatPolicy(updated);
  }

  static async deletePolicy(id: string) {
    logger.debug(`SlaService.deletePolicy: ${id}`);
    const existing = await SlaRepository.findById(id);
    if (!existing) throw new NotFoundError("SLA Policy not found");
    await SlaRepository.delete(id);
    return { deleted: true };
  }

  // ─── SLA Calculations ────────────────────────────────────────────────────────
  /**
   * Determine target due deadline based on active SLA policy or defaults
   */
  static async calculateDueAt(createdAt: Date, priority: string): Promise<Date> {
    const policy = await SlaRepository.findByPriority(priority);
    const limitMinutes = policy && policy.isActive ? policy.resolveTimeLimit : (DEFAULT_LIMITS[priority] ?? 1440);
    return new Date(createdAt.getTime() + limitMinutes * 60 * 1000);
  }

  /**
   * Pause/Resume logic: Shifts dueAt deadline if ticket was paused in PENDING status
   */
  static async handleSlaPauseResume(ticket: { dueAt: Date | null; updatedAt: Date }, oldStatus: string, newStatus: string): Promise<Date | null> {
    if (!ticket.dueAt) return null;
    if (oldStatus === "PENDING" && newStatus !== "PENDING") {
      // Shifting dueAt forward by the time spent in PENDING status
      const now = new Date();
      const pausedDuration = now.getTime() - ticket.updatedAt.getTime();
      if (pausedDuration > 0) {
        logger.debug({ ticketId: (ticket as any).id, pausedDuration }, "SLA Resume: Shifting due deadline forward");
        return new Date(ticket.dueAt.getTime() + pausedDuration);
      }
    }
    return null;
  }

  // ─── Violations & Escalations ────────────────────────────────────────────────
  /**
   * Scan active tickets for SLA breach, escalate to department administrators, post comments, and bump priority
   */
  static async checkSlaViolations(): Promise<{ escalatedCount: number }> {
    logger.debug("Running SLA violations check...");
    const now = new Date();

    // Query active tickets that breached deadline
    const tickets = await prisma.ticket.findMany({
      where: {
        status: { notIn: ["RESOLVED", "CLOSED"] },
        dueAt: { lte: now },
      },
      include: {
        comments: {
          select: { content: true },
        },
      },
    });

    let escalatedCount = 0;

    for (const t of tickets) {
      // Prevent duplicate escalation comments
      const alreadyEscalated = t.comments.some((c) => c.content.startsWith("[SLA Breach Escalation]"));
      if (alreadyEscalated) continue;

      logger.warn({ ticketId: t.id, ticketNumber: t.ticketNumber }, "SLA breach detected!");

      // Resolve escalation actor (SYSTEM_ADMIN role)
      const admin = await prisma.user.findFirst({
        where: { role: { name: "SYSTEM_ADMIN" }, isActive: true },
        select: { id: true },
      });
      const authorId = admin?.id;

      if (authorId) {
        // 1. Post warning audit comment
        await prisma.ticketComment.create({
          data: {
            ticketId: t.id,
            authorId,
            content: `[SLA Breach Escalation] Resolution deadline of ${t.dueAt?.toLocaleString()} has been breached. Escalate support.`,
            isInternal: true,
          },
        });

        // 2. Escalate Ticket: Raise priority to CRITICAL and assign to department manager
        const deptAdmin = await prisma.user.findFirst({
          where: {
            departmentId: t.departmentId,
            role: { name: "DEPT_ADMIN" },
            isActive: true,
          },
          select: { id: true },
        });

        const updateData: Prisma.TicketUpdateInput = { priority: "CRITICAL" };
        if (deptAdmin) {
          updateData.assignee = { connect: { id: deptAdmin.id } };
          updateData.status = "ASSIGNED";
        }

        await prisma.ticket.update({
          where: { id: t.id },
          data: updateData,
        });

        escalatedCount++;
      }
    }

    logger.debug({ escalatedCount }, "SLA violations scan finished.");
    return { escalatedCount };
  }

  // ─── Compliance Reports ─────────────────────────────────────────────────────
  /**
   * Fetch aggregate compliance scores, total breach volumes, and avg resolution limits
   */
  static async getSlaComplianceReport() {
    logger.debug("SlaService.getSlaComplianceReport");
    const now = new Date();

    const [resolvedTickets, totalActiveBreaches] = await Promise.all([
      prisma.ticket.findMany({
        where: {
          status: { in: ["RESOLVED", "CLOSED"] },
          dueAt: { not: null },
        },
        select: {
          id: true,
          priority: true,
          dueAt: true,
          resolvedAt: true,
          closedAt: true,
          createdAt: true,
        },
      }),
      prisma.ticket.count({
        where: {
          status: { notIn: ["RESOLVED", "CLOSED"] },
          dueAt: { lte: now },
        },
      }),
    ]);

    let metCount = 0;
    let totalBreaches = 0;
    let totalResolutionTimeMs = 0;
    const breachesByPriority: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };

    for (const t of resolvedTickets) {
      const finalTime = t.resolvedAt || t.closedAt || new Date();
      const hasBreached = finalTime.getTime() > t.dueAt!.getTime();

      if (!hasBreached) {
        metCount++;
      } else {
        totalBreaches++;
        breachesByPriority[t.priority] = (breachesByPriority[t.priority] ?? 0) + 1;
      }

      totalResolutionTimeMs += finalTime.getTime() - t.createdAt.getTime();
    }

    const totalResolved = resolvedTickets.length;
    const complianceRate = totalResolved > 0 ? Math.round((metCount / totalResolved) * 100) : 100;
    const avgResolveTimeMin = totalResolved > 0 ? Math.round((totalResolutionTimeMs / totalResolved) / (60 * 1000)) : 0;

    return {
      complianceRate,
      totalResolved,
      metCount,
      totalBreaches,
      activeBreaches: totalActiveBreaches,
      breachesByPriority,
      avgResolveTimeMin,
    };
  }
}
