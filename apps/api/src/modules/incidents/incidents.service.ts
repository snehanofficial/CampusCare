import { IncidentsRepository } from "./incidents.repository.js";
import { CreateIncidentInput, UpdateIncidentInput } from "./incidents.schema.js";
import { NotFoundError } from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";
import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatIncident(
  inc: Awaited<ReturnType<typeof IncidentsRepository.findById>>,
) {
  if (!inc) return null;
  return {
    id: inc.id,
    title: inc.title,
    description: inc.description,
    rootCause: inc.rootCause ?? null,
    status: inc.status,
    severity: inc.severity,
    resolvedAt: inc.resolvedAt?.toISOString() ?? null,
    createdAt: inc.createdAt.toISOString(),
    updatedAt: inc.updatedAt.toISOString(),
    linkedTickets: inc.tickets.map((t) => ({
      id: t.ticket.id,
      ticketNumber: t.ticket.ticketNumber,
      title: t.ticket.title,
      status: t.ticket.status,
      priority: t.ticket.priority,
      createdAt: t.ticket.createdAt.toISOString(),
    })),
    linkedTicketCount: inc.tickets.length,
  };
}

async function getAdminActorId(): Promise<string> {
  const admin = await prisma.user.findFirst({
    where: { role: { name: "SYSTEM_ADMIN" } },
    select: { id: true },
  });
  return admin?.id ?? "";
}

// ─── Service ───────────────────────────────────────────────────────────────────
export class IncidentsService {
  // ── List ─────────────────────────────────────────────────────────────────────
  static async listIncidents(params: {
    search?: string;
    status?: string;
    severity?: string;
    page?: number;
    pageSize?: number;
  }) {
    logger.debug({ params }, "IncidentsService.listIncidents");

    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));
    const skip = (page - 1) * pageSize;

    const where: Prisma.IncidentWhereInput = {};

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
        { rootCause: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (params.status) where.status = params.status;
    if (params.severity) where.severity = params.severity;

    const [incidents, total] = await Promise.all([
      IncidentsRepository.findMany({ skip, take: pageSize, where }),
      IncidentsRepository.count(where),
    ]);

    return {
      data: incidents.map((inc) => formatIncident(inc)!),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    };
  }

  // ── Get by ID ─────────────────────────────────────────────────────────────────
  static async getIncidentById(id: string) {
    logger.debug(`IncidentsService.getIncidentById: ${id}`);
    const inc = await IncidentsRepository.findById(id);
    if (!inc) throw new NotFoundError("Incident not found");
    return formatIncident(inc)!;
  }

  // ── Create ────────────────────────────────────────────────────────────────────
  static async createIncident(input: CreateIncidentInput) {
    logger.debug({ title: input.title }, "IncidentsService.createIncident");

    const inc = await IncidentsRepository.create({
      title: input.title,
      description: input.description,
      severity: input.severity,
      status: input.status ?? "OPEN",
      rootCause: input.rootCause ?? null,
    });

    const actorId = await getAdminActorId();

    // Log creation audit log
    if (actorId) {
      await prisma.auditLog.create({
        data: {
          action: "INCIDENT_CREATE",
          targetTable: "incidents",
          targetId: inc.id,
          newValue: { title: inc.title, severity: inc.severity, status: inc.status },
          performedById: actorId,
        },
      });
    }

    // Link tickets after creation
    if (input.ticketIds && input.ticketIds.length > 0) {
      await IncidentsRepository.linkTickets(inc.id, input.ticketIds);
      if (actorId) {
        await prisma.auditLog.create({
          data: {
            action: "INCIDENT_TICKET_LINK",
            targetTable: "incidents",
            targetId: inc.id,
            newValue: { ticketIds: input.ticketIds },
            performedById: actorId,
          },
        });
      }
    }

    // Trigger mass notification for CRITICAL / HIGH outages
    if (inc.severity === "CRITICAL" || inc.severity === "HIGH") {
      const activeUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      if (activeUsers.length > 0) {
        await prisma.notification.createMany({
          data: activeUsers.map((u) => ({
            userId: u.id,
            title: `Critical Outage Outburst: ${inc.title}`,
            message: `A critical infrastructure incident has been declared: ${inc.description.slice(0, 100)}...`,
            type: "ERROR",
            category: "SYSTEM",
            referenceId: inc.id,
          })),
        });
      }
    }

    // Re-fetch with links
    const fresh = await IncidentsRepository.findById(inc.id);
    return formatIncident(fresh)!;
  }

  // ── Update ────────────────────────────────────────────────────────────────────
  static async updateIncident(id: string, input: UpdateIncidentInput) {
    logger.debug({ id, input }, "IncidentsService.updateIncident");

    const existing = await IncidentsRepository.findById(id);
    if (!existing) throw new NotFoundError("Incident not found");

    const data: Prisma.IncidentUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.severity !== undefined) data.severity = input.severity;
    if (input.rootCause !== undefined) data.rootCause = input.rootCause ?? null;

    const actorId = await getAdminActorId();

    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === "RESOLVED" && !existing.resolvedAt) {
        data.resolvedAt = new Date();
      }
    }

    const updated = await IncidentsRepository.update(id, data);

    // Log update audit log
    if (actorId) {
      await prisma.auditLog.create({
        data: {
          action: "INCIDENT_UPDATE",
          targetTable: "incidents",
          targetId: id,
          oldValue: { status: existing.status, severity: existing.severity },
          newValue: { status: updated.status, severity: updated.severity },
          performedById: actorId,
        },
      });
    }

    // Sync linked tickets only if caller explicitly provided the list
    if (input.ticketIds !== undefined) {
      await IncidentsRepository.replaceTicketLinks(id, input.ticketIds);
      if (actorId) {
        await prisma.auditLog.create({
          data: {
            action: "INCIDENT_TICKET_LINK",
            targetTable: "incidents",
            targetId: id,
            newValue: { ticketIds: input.ticketIds },
            performedById: actorId,
          },
        });
      }
    }

    // Bulk Ticket Resolution: resolve all tickets linked to this incident when the incident is resolved
    if (updated.status === "RESOLVED" && existing.status !== "RESOLVED") {
      logger.info({ incidentId: id }, "Incident resolved: running bulk ticket resolution...");
      const incidentTickets = await prisma.incidentTicket.findMany({
        where: { incidentId: id },
        include: { ticket: true },
      });

      for (const it of incidentTickets) {
        if (it.ticket.status !== "RESOLVED" && it.ticket.status !== "CLOSED") {
          await prisma.ticket.update({
            where: { id: it.ticketId },
            data: {
              status: "RESOLVED",
              resolvedAt: new Date(),
            },
          });

          if (actorId) {
            // Post an automation comment on resolved ticket
            await prisma.ticketComment.create({
              data: {
                ticketId: it.ticketId,
                authorId: actorId,
                content: `[Incident Automation] Ticket auto-resolved as part of bulk resolution for linked incident: "${updated.title}".`,
                isInternal: false,
              },
            });

            // Log ticket update in audit logs
            await prisma.auditLog.create({
              data: {
                action: "TICKET_UPDATE",
                targetTable: "tickets",
                targetId: it.ticketId,
                oldValue: { status: it.ticket.status },
                newValue: { status: "RESOLVED" },
                performedById: actorId,
              },
            });
          }
        }
      }
    }

    const fresh = await IncidentsRepository.findById(id);
    return formatIncident(fresh)!;
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  static async deleteIncident(id: string) {
    logger.debug(`IncidentsService.deleteIncident: ${id}`);
    const existing = await IncidentsRepository.findById(id);
    if (!existing) throw new NotFoundError("Incident not found");
    await IncidentsRepository.delete(id);
    return { deleted: true };
  }

  // ── Timeline ─────────────────────────────────────────────────────────────────
  static async getIncidentTimeline(id: string) {
    logger.debug(`IncidentsService.getIncidentTimeline: ${id}`);
    const existing = await IncidentsRepository.findById(id);
    if (!existing) throw new NotFoundError("Incident not found");

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        targetTable: "incidents",
        targetId: id,
      },
      orderBy: { createdAt: "asc" },
      include: {
        performedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return auditLogs.map((l) => ({
      id: l.id,
      action: l.action,
      oldValue: l.oldValue,
      newValue: l.newValue,
      performedByName: `${l.performedBy.firstName} ${l.performedBy.lastName}`,
      createdAt: l.createdAt.toISOString(),
    }));
  }
}

