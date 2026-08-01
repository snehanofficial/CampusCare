import { Request, Response, NextFunction } from "express";
import { TicketsService } from "./tickets.service.js";
import { sendSuccess } from "../../middleware/response.js";
import { ForbiddenError } from "../../utils/errors.js";
import {
  createTicketSchema,
  updateTicketSchema,
  addCommentSchema,
  reopenTicketSchema,
} from "./tickets.schema.js";

function parseIntParam(val: string | undefined): number | undefined {
  if (!val) return undefined;
  const n = parseInt(val, 10);
  return isNaN(n) ? undefined : n;
}

export class TicketsController {
  // ── GET /tickets ─────────────────────────────────────────────────────────────
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = req.user!.permissions;
      let creatorId = req.query.creatorId?.toString();
      if (req.user!.role !== "SYSTEM_ADMIN" && permissions.includes("tickets:read_own") && !permissions.includes("tickets:read")) {
        creatorId = req.user!.id;
      }

      const result = await TicketsService.listTickets({
        search: req.query.search?.toString(),
        status: req.query.status?.toString(),
        priority: req.query.priority?.toString(),
        creatorId,
        assigneeId: req.query.assigneeId?.toString(),
        departmentId: req.query.departmentId?.toString(),
        categoryId: req.query.categoryId?.toString(),
        isIncident: req.query.isIncident?.toString(),
        page: parseIntParam(req.query.page?.toString()),
        pageSize: parseIntParam(req.query.pageSize?.toString()),
        sortBy: req.query.sortBy?.toString(),
        sortOrder: req.query.sortOrder === "asc" || req.query.sortOrder === "desc" ? req.query.sortOrder : undefined,
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /tickets/:id ─────────────────────────────────────────────────────────
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const ticket = await TicketsService.getTicketById(id as string);

      const permissions = req.user!.permissions;
      if (req.user!.role !== "SYSTEM_ADMIN" && permissions.includes("tickets:read_own") && !permissions.includes("tickets:read")) {
        if (ticket.creatorId !== req.user!.id) {
          throw new ForbiddenError("You are not authorized to view this ticket");
        }
      }

      sendSuccess(res, ticket);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /tickets ─────────────────────────────────────────────────────────────
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createTicketSchema.parse(req.body);
      const ticket = await TicketsService.createTicket(req.user!.id, input);
      sendSuccess(res, ticket, 201);
    } catch (err) {
      next(err);
    }
  }

  // ── PUT /tickets/:id ──────────────────────────────────────────────────────────
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const ticket = await TicketsService.getTicketById(id as string);

      const permissions = req.user!.permissions;
      const hasUpdateAll = permissions.includes("tickets:update_all") || req.user!.role === "SYSTEM_ADMIN";
      const hasUpdateOwn = permissions.includes("tickets:update_own");

      // Ownership check: update_own users can only update their own tickets
      if (!hasUpdateAll) {
        if (!hasUpdateOwn || ticket.creatorId !== req.user!.id) {
          throw new ForbiddenError("You are not authorized to update this ticket");
        }
        // Field restriction: STUDENT/FACULTY with update_own cannot change privileged fields
        const RESTRICTED_FIELDS = ["status", "priority", "assigneeId", "categoryId", "departmentId"];
        const attemptedRestricted = RESTRICTED_FIELDS.filter((f) => req.body[f] !== undefined);
        if (attemptedRestricted.length > 0) {
          throw new ForbiddenError(
            `You are not authorized to modify: ${attemptedRestricted.join(", ")}`
          );
        }
      }

      const input = updateTicketSchema.parse(req.body);
      const updatedTicket = await TicketsService.updateTicket(id as string, input);
      sendSuccess(res, updatedTicket);
    } catch (err) {
      next(err);
    }
  }

  // ── DELETE /tickets/:id ───────────────────────────────────────────────────────
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await TicketsService.deleteTicket(id as string);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /tickets/:id/comments ────────────────────────────────────────────────
  static async addComment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const input = addCommentSchema.parse(req.body);
      const comment = await TicketsService.addComment(
        id as string,
        req.user!.id,
        input,
      );
      sendSuccess(res, comment, 201);
    } catch (err) {
      next(err);
    }
  }

  // ── DELETE /tickets/:id/comments/:commentId ───────────────────────────────────
  static async deleteComment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id, commentId } = req.params;
      const result = await TicketsService.deleteComment(
        id as string,
        commentId as string,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /tickets/merge ───────────────────────────────────────────────────────
  static async merge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { primaryTicketId, secondaryTicketIds } = req.body;
      if (!primaryTicketId || !Array.isArray(secondaryTicketIds)) {
        res.status(400).json({ success: false, error: { message: "Invalid payload params" } });
        return;
      }
      const ticket = await TicketsService.mergeTickets(
        primaryTicketId,
        secondaryTicketIds,
        req.user!.id
      );
      sendSuccess(res, ticket);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /tickets/:id/verify ──────────────────────────────────────────────────
  static async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await TicketsService.confirmResolution(id as string, req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /tickets/:id/reopen ──────────────────────────────────────────────────
  static async reopen(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = reopenTicketSchema.parse(req.body);
      const result = await TicketsService.reopenTicket(id as string, req.user!.id, reason);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /tickets/auto-close ──────────────────────────────────────────────────
  static async autoClose(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TicketsService.autoCloseResolvedTickets();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}


