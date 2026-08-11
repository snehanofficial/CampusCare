import { Request, Response, NextFunction } from "express";
import { TechniciansService } from "./technicians.service.js";
import { sendSuccess } from "../../middleware/response.js";
import { ForbiddenError, BadRequestError } from "../../utils/errors.js";
import { setUnavailabilitySchema } from "./technicians.schema.js";

function canManage(req: Request, technicianId: string): boolean {
  const user = req.user!;
  if (user.id === technicianId) return true;
  return user.role === "SYSTEM_ADMIN" || user.permissions.includes("technicians:manage");
}

export class TechniciansController {
  // ── GET /technicians/eligible?departmentId= ─────────────────────────────────
  static async listEligible(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departmentId = req.query.departmentId as string | undefined;
      if (!departmentId) throw new BadRequestError("departmentId query parameter is required");
      const result = await TechniciansService.getEligibleWithWorkload(departmentId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /technicians/workload?ids=a,b,c ──────────────────────────────────────
  // A caller without technicians:manage/tickets:assign is silently restricted
  // to their own id (never 403s outright) — a technician may always see their
  // own workload; nobody else's is ever exposed to them via this endpoint.
  static async getWorkload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idsParam = req.query.ids as string | undefined;
      let ids = idsParam ? idsParam.split(",").filter(Boolean) : [];
      const isPrivileged =
        req.user!.role === "SYSTEM_ADMIN" ||
        req.user!.permissions.includes("technicians:manage") ||
        req.user!.permissions.includes("tickets:assign");
      if (!isPrivileged) {
        ids = ids.filter((requestedId) => requestedId === req.user!.id);
      }
      const result = await TechniciansService.getWorkloadForIds(ids);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /technicians/availability?departmentId= ─────────────────────────────
  static async listAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departmentId = req.query.departmentId as string | undefined;
      const result = await TechniciansService.listTeamAvailability(departmentId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /technicians/:id/availability ────────────────────────────────────────
  // Self-or-admin, same authorization as the mutation endpoints below — lets a
  // technician view their own availability without needing technicians:manage
  // or tickets:assign, which the bulk /technicians/availability list requires.
  static async getAvailabilityForOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!canManage(req, id as string)) {
        throw new ForbiddenError("You can only view your own availability");
      }
      const result = await TechniciansService.getAvailabilityFor(id as string);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── PUT /technicians/:id/unavailability ──────────────────────────────────────
  static async setUnavailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!canManage(req, id as string)) {
        throw new ForbiddenError("You can only manage your own availability");
      }
      const input = setUnavailabilitySchema.parse(req.body);
      const result = await TechniciansService.setUnavailability(
        { id: req.user!.id, role: req.user!.role },
        id as string,
        input,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── DELETE /technicians/:id/unavailability ───────────────────────────────────
  static async clearUnavailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!canManage(req, id as string)) {
        throw new ForbiddenError("You can only manage your own availability");
      }
      const result = await TechniciansService.clearUnavailability(
        { id: req.user!.id, role: req.user!.role },
        id as string,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /technicians/auto-assign/:ticketId ──────────────────────────────────
  static async autoAssign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ticketId } = req.params;
      const result = await TechniciansService.autoAssignTicket(ticketId as string, req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export default TechniciansController;
