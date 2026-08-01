import { TicketsRepository } from "./tickets.repository.js";
import {
  CreateTicketInput,
  UpdateTicketInput,
  AddCommentInput,
} from "./tickets.schema.js";
import { NotFoundError, BadRequestError } from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";
import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";


import { AutomationService } from "../automation/automation.service.js";
import { SlaService } from "../sla/sla.service.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateTicketNumber(): string {
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `TIC-${suffix}`;
}

function formatTicket(t: Awaited<ReturnType<typeof TicketsRepository.findById>>) {
  if (!t) return null;
  return {
    id: t.id,
    ticketNumber: t.ticketNumber,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    creatorId: t.creatorId,
    creatorName: `${t.creator.firstName} ${t.creator.lastName}`,
    assigneeId: t.assigneeId ?? null,
    assigneeName: t.assignee
      ? `${t.assignee.firstName} ${t.assignee.lastName}`
      : null,
    categoryId: t.categoryId,
    categoryName: t.category.name,
    departmentId: t.departmentId,
    departmentName: t.department.name,
    isIncident: t.incidents.length > 0,
    incidentLinks: t.incidents.map((it) => ({
      id: it.incident.id,
      title: it.incident.title,
      status: it.incident.status,
      severity: it.incident.severity,
    })),
    comments: t.comments.map((c) => ({
      id: c.id,
      content: c.content,
      isInternal: c.isInternal,
      authorId: c.authorId,
      authorName: `${c.author.firstName} ${c.author.lastName}`,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    resolvedAt: t.resolvedAt?.toISOString() ?? null,
    closedAt: t.closedAt?.toISOString() ?? null,
    dueAt: t.dueAt?.toISOString() ?? null,
    reopenCount: t.reopenCount,
    reopenReason: t.reopenReason,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────
export class TicketsService {
  // ... rest of listTickets code ...
  static async listTickets(params: {
    search?: string;
    status?: string;
    priority?: string;
    creatorId?: string;
    assigneeId?: string;
    departmentId?: string;
    categoryId?: string;
    isIncident?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    logger.debug({ params }, "TicketsService.listTickets");

    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));
    const skip = (page - 1) * pageSize;

    const where: Prisma.TicketWhereInput = {};

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
        { ticketNumber: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (params.status) where.status = params.status;
    if (params.priority) where.priority = params.priority;
    if (params.creatorId) where.creatorId = params.creatorId;
    if (params.assigneeId) where.assigneeId = params.assigneeId;
    if (params.departmentId) where.departmentId = params.departmentId;
    if (params.categoryId) where.categoryId = params.categoryId;

    if (params.isIncident === "true") {
      where.incidents = { some: {} };
    } else if (params.isIncident === "false") {
      where.incidents = { none: {} };
    }

    const orderBy: Prisma.TicketOrderByWithRelationInput = {};
    if (params.sortBy) {
      const order = params.sortOrder ?? "desc";
      if (params.sortBy === "creatorName") {
        orderBy.creator = { firstName: order };
      } else if (params.sortBy === "categoryName") {
        orderBy.category = { name: order };
      } else if (params.sortBy === "departmentName") {
        orderBy.department = { name: order };
      } else {
        (orderBy as Record<string, string>)[params.sortBy] = order;
      }
    } else {
      orderBy.createdAt = "desc";
    }

    const [tickets, total] = await Promise.all([
      TicketsRepository.findMany({ skip, take: pageSize, where, orderBy }),
      TicketsRepository.count(where),
    ]);

    return {
      data: tickets.map((t) => formatTicket(t)!),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    };
  }

  // ── Get by ID ────────────────────────────────────────────────────────────────
  static async getTicketById(id: string) {
    logger.debug(`TicketsService.getTicketById: ${id}`);
    const t = await TicketsRepository.findById(id);
    if (!t) throw new NotFoundError("Ticket not found");
    const formatted = formatTicket(t)!;

    const auditLogs = await prisma.auditLog.findMany({
      where: { targetTable: "tickets", targetId: id },
      include: { performedBy: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "desc" }
    });

    const automationLogs = await prisma.automationLog.findMany({
      where: { ticketId: id },
      include: { rule: true },
      orderBy: { createdAt: "desc" }
    });

    return {
      ...formatted,
      auditLogs: auditLogs.map(l => ({
        id: l.id,
        action: l.action,
        oldValue: l.oldValue,
        newValue: l.newValue,
        performedByName: `${l.performedBy.firstName} ${l.performedBy.lastName}`,
        createdAt: l.createdAt.toISOString()
      })),
      automationLogs: automationLogs.map(al => ({
        id: al.id,
        ruleName: al.rule.name,
        triggered: al.triggered,
        actionsRun: al.actionsRun,
        createdAt: al.createdAt.toISOString()
      }))
    };
  }

  // ── Create ───────────────────────────────────────────────────────────────────
  static async createTicket(creatorId: string, input: CreateTicketInput) {
    logger.debug({ creatorId, title: input.title }, "TicketsService.createTicket");

    // Generate a unique ticket number (retry on collision)
    let ticketNumber = generateTicketNumber();
    let attempts = 0;
    while (
      (await TicketsRepository.findByTicketNumber(ticketNumber)) &&
      attempts < 5
    ) {
      ticketNumber = generateTicketNumber();
      attempts++;
    }

    const now = new Date();
    const dueAt = await SlaService.calculateDueAt(now, input.priority);

    const ticket = await TicketsRepository.create({
      ticketNumber,
      title: input.title,
      description: input.description,
      status: "OPEN",
      priority: input.priority,
      dueAt,
      creator: { connect: { id: creatorId } },
      category: { connect: { id: input.categoryId } },
      department: { connect: { id: input.departmentId } },
      ...(input.assetId ? { asset: { connect: { id: input.assetId } } } : {}),
    });

    // Evaluate automation rules after creation
    await AutomationService.evaluateRules(
      {
        id: ticket.id,
        status: ticket.status,
        priority: ticket.priority,
        categoryId: ticket.categoryId,
        departmentId: ticket.departmentId,
        assigneeId: ticket.assigneeId,
        creatorId: ticket.creatorId,
        title: ticket.title,
        description: ticket.description,
      },
      "ON_CREATE",
    );

    // Re-fetch ticket in case rules updated its state
    const freshTicket = await TicketsRepository.findById(ticket.id);
    return formatTicket(freshTicket)!;
  }

  // ── Update ───────────────────────────────────────────────────────────────────
  static async updateTicket(id: string, input: UpdateTicketInput) {
    logger.debug({ id, input }, "TicketsService.updateTicket");

    const existing = await TicketsRepository.findById(id);
    if (!existing) throw new NotFoundError("Ticket not found");

    // Guard: cannot re-open a CLOSED ticket via plain update
    if (existing.status === "CLOSED" && input.status && input.status !== "CLOSED") {
      throw new BadRequestError(
        "A CLOSED ticket cannot be updated. Use the reopen workflow."
      );
    }

    const data: Prisma.TicketUpdateInput = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.priority !== undefined) {
      data.priority = input.priority;
      // Recalculate SLA deadline when priority shifts
      if (input.priority !== existing.priority) {
        data.dueAt = await SlaService.calculateDueAt(existing.createdAt, input.priority);
      }
    }
    if (input.categoryId !== undefined)
      data.category = { connect: { id: input.categoryId } };
    if (input.departmentId !== undefined)
      data.department = { connect: { id: input.departmentId } };

    if (input.assetId !== undefined) {
      data.asset = input.assetId === null ? { disconnect: true } : { connect: { id: input.assetId } };
    }

    if (input.assigneeId !== undefined) {
      data.assignee =
        input.assigneeId === null
          ? { disconnect: true }
          : { connect: { id: input.assigneeId } };
      // Auto-advance OPEN → ASSIGNED when someone is assigned
      if (input.assigneeId !== null && existing.status === "OPEN" && !input.status) {
        data.status = "ASSIGNED";
      }
    }

    if (input.status !== undefined) {
      // Guard: technicians cannot close tickets directly without verification
      if (input.status === "CLOSED") {
        throw new BadRequestError(
          "Technicians cannot close tickets directly. Please use the Creator Verification workflow."
        );
      }
      data.status = input.status;
      if (input.status === "RESOLVED" && !existing.resolvedAt) {
        data.resolvedAt = new Date();
      }

      // Handle pause/resume shifts on status changes
      const resumedDueAt = await SlaService.handleSlaPauseResume(existing, existing.status, input.status);
      if (resumedDueAt) {
        data.dueAt = resumedDueAt;
      }
    }

    const updated = await TicketsRepository.update(id, data);

    // Evaluate automation rules after update
    const isStatusChange = input.status !== undefined && input.status !== existing.status;
    await AutomationService.evaluateRules(
      {
        id: updated.id,
        status: updated.status,
        priority: updated.priority,
        categoryId: updated.categoryId,
        departmentId: updated.departmentId,
        assigneeId: updated.assigneeId,
        creatorId: updated.creatorId,
        title: updated.title,
        description: updated.description,
      },
      isStatusChange ? "ON_STATUS_CHANGE" : "ON_UPDATE",
    );

    // Re-fetch updated ticket in case rules updated its state
    const freshTicket = await TicketsRepository.findById(id);
    return formatTicket(freshTicket)!;
  }


  // ── Delete ───────────────────────────────────────────────────────────────────
  static async deleteTicket(id: string) {
    logger.debug(`TicketsService.deleteTicket: ${id}`);
    const existing = await TicketsRepository.findById(id);
    if (!existing) throw new NotFoundError("Ticket not found");
    await TicketsRepository.delete(id);
    return { deleted: true };
  }

  // ── Comments ────────────────────────────────────────────────────────────────
  static async addComment(ticketId: string, authorId: string, input: AddCommentInput) {
    logger.debug({ ticketId, authorId }, "TicketsService.addComment");
    const existing = await TicketsRepository.findById(ticketId);
    if (!existing) throw new NotFoundError("Ticket not found");

    const comment = await TicketsRepository.addComment(
      ticketId,
      authorId,
      input.content,
      input.isInternal ?? false,
    );

    return {
      id: comment.id,
      content: comment.content,
      isInternal: comment.isInternal,
      authorId: comment.authorId,
      authorName: `${comment.author.firstName} ${comment.author.lastName}`,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }

  static async deleteComment(ticketId: string, commentId: string) {
    logger.debug({ ticketId, commentId }, "TicketsService.deleteComment");
    const existing = await TicketsRepository.findById(ticketId);
    if (!existing) throw new NotFoundError("Ticket not found");
    await TicketsRepository.deleteComment(commentId);
    return { deleted: true };
  }

  static async mergeTickets(primaryId: string, secondaryIds: string[], actorId: string) {
    logger.info({ primaryId, secondaryIds }, "TicketsService.mergeTickets");

    const primary = await TicketsRepository.findById(primaryId);
    if (!primary) throw new NotFoundError("Primary ticket not found");

    for (const secId of secondaryIds) {
      if (secId === primaryId) continue;
      const secondary = await TicketsRepository.findById(secId);
      if (!secondary) continue;

      // Copy comments
      for (const comment of secondary.comments) {
        await TicketsRepository.addComment(
          primaryId,
          comment.authorId,
          `[Merged from ${secondary.ticketNumber}] ${comment.content}`,
          comment.isInternal
        );
      }

      // Close the secondary ticket
      await TicketsRepository.update(secId, {
        status: "CLOSED",
        closedAt: new Date(),
      });

      // Add audit comment on secondary ticket linking to primary
      await TicketsRepository.addComment(
        secId,
        actorId,
        `[Ticket Merge] This ticket has been merged into primary ticket ${primary.ticketNumber}.`,
        true
      );

      // Create update audit logs
      await prisma.auditLog.create({
        data: {
          action: "TICKET_MERGE",
          targetTable: "tickets",
          targetId: secId,
          newValue: { mergedInto: primary.ticketNumber },
          performedById: actorId,
        },
      });
    }

    // Return the fresh state of the primary ticket
    const freshPrimary = await TicketsRepository.findById(primaryId);
    return formatTicket(freshPrimary)!;
  }

  // ── Verification & Reopen Workflows ───────────────────────────────────────
  static async confirmResolution(ticketId: string, userId: string) {
    logger.info({ ticketId, userId }, "TicketsService.confirmResolution");
    const ticket = await TicketsRepository.findById(ticketId);
    if (!ticket) throw new NotFoundError("Ticket not found");

    if (ticket.status !== "RESOLVED") {
      throw new BadRequestError("Only resolved tickets can be verified.");
    }

    const updated = await TicketsRepository.update(ticketId, {
      status: "CLOSED",
      closedAt: new Date(),
    });

    // Add confirmation comment
    await TicketsRepository.addComment(
      ticketId,
      userId,
      "[Verification] Creator confirmed resolution. Ticket permanently closed.",
      false
    );

    // Log update audit logs
    await prisma.auditLog.create({
      data: {
        action: "TICKET_VERIFY_CLOSE",
        targetTable: "tickets",
        targetId: ticketId,
        newValue: { status: "CLOSED" },
        performedById: userId,
      },
    });

    return formatTicket(updated)!;
  }

  static async reopenTicket(ticketId: string, userId: string, reason: string) {
    logger.info({ ticketId, userId, reason }, "TicketsService.reopenTicket");
    const ticket = await TicketsRepository.findById(ticketId);
    if (!ticket) throw new NotFoundError("Ticket not found");

    if (ticket.status !== "RESOLVED") {
      throw new BadRequestError("Only resolved tickets can be reopened.");
    }

    // Reopen Window Check: 24 hours
    if (ticket.resolvedAt) {
      const diff = Date.now() - ticket.resolvedAt.getTime();
      if (diff > 24 * 60 * 60 * 1000) {
        throw new BadRequestError(
          "The reopen window has expired. Please open a new ticket instead."
        );
      }
    }

    const nextReopenCount = ticket.reopenCount + 1;
    const isEscalated = nextReopenCount > 1;

    const data: Prisma.TicketUpdateInput = {
      status: "ASSIGNED",
      reopenCount: nextReopenCount,
      reopenReason: reason,
      resolvedAt: null, // Clear resolution timestamp
    };

    // Calculate new SLA due deadline (add standard cycle)
    const now = new Date();
    data.dueAt = await SlaService.calculateDueAt(now, ticket.priority);

    // Automatic Reassignment & Escalation
    if (isEscalated) {
      data.priority = "CRITICAL";
      // Find DEPT_ADMIN to route escalation to
      const deptAdmin = await prisma.user.findFirst({
        where: {
          departmentId: ticket.departmentId,
          role: { name: "DEPT_ADMIN" },
          isActive: true,
        },
        select: { id: true },
      });
      if (deptAdmin) {
        data.assignee = { connect: { id: deptAdmin.id } };
      } else {
        data.assignee = { disconnect: true }; // Trigger triage
      }
    }

    const updated = await TicketsRepository.update(ticketId, data);

    // Add reopen comment
    const reopenCommentContent = `[Reopen] Ticket reopened by creator. Reason: "${reason}"`;
    await TicketsRepository.addComment(ticketId, userId, reopenCommentContent, false);

    // Post escalation alert if needed
    if (isEscalated) {
      await TicketsRepository.addComment(
        ticketId,
        userId,
        `[Reopen Escalation] Ticket has been reopened ${nextReopenCount} times. Raised priority to CRITICAL and escalated to supervisor review.`,
        true
      );
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: "TICKET_REOPEN",
        targetTable: "tickets",
        targetId: ticketId,
        newValue: { status: "ASSIGNED", reopenCount: nextReopenCount },
        performedById: userId,
      },
    });

    return formatTicket(updated)!;
  }

  static async autoCloseResolvedTickets() {
    logger.info("Running automated resolved tickets verification close-out...");
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago

    const resolved = await prisma.ticket.findMany({
      where: {
        status: "RESOLVED",
        resolvedAt: { lte: threshold },
      },
      select: { id: true },
    });

    if (resolved.length === 0) return { closedCount: 0 };

    // Find a system admin to perform action
    const admin = await prisma.user.findFirst({
      where: { role: { name: "SYSTEM_ADMIN" } },
      select: { id: true },
    });
    const actorId = admin?.id ?? "";

    for (const t of resolved) {
      await prisma.ticket.update({
        where: { id: t.id },
        data: {
          status: "CLOSED",
          closedAt: new Date(),
        },
      });

      if (actorId) {
        await prisma.ticketComment.create({
          data: {
            ticketId: t.id,
            authorId: actorId,
            content: "[System Automation] Auto-closed after 24 hours of inactivity since resolution.",
            isInternal: false,
          },
        });

        await prisma.auditLog.create({
          data: {
            action: "TICKET_AUTO_CLOSE",
            targetTable: "tickets",
            targetId: t.id,
            newValue: { status: "CLOSED" },
            performedById: actorId,
          },
        });
      }
    }

    return { closedCount: resolved.length };
  }
}

