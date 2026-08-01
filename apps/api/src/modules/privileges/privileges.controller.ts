import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../middleware/response.js";
import { PrivilegesService } from "./privileges.service.js";
import { PrivilegeRequestsService } from "./privileges.requests.service.js";
import { buildDeviceInfo, buildIpAddress, type ActorContext } from "./privileges.helpers.js";
import {
  createRequestSchema,
  listFiltersSchema,
  rejectRequestSchema,
  reviewRequestSchema,
} from "./privileges.schema.js";

/** Builds the audit-aware actor context from the authenticated request. */
export function toActor(req: Request): ActorContext {
  const user = req.user!;
  return {
    id: user.id,
    role: user.role,
    departmentId: user.departmentId ?? null,
    performedById: user.id,
    ipAddress: buildIpAddress(req),
    userAgent: req.headers["user-agent"],
    deviceInfo: buildDeviceInfo(req),
  };
}

export class PrivilegesController {
  // ── POST /privileges/request ────────────────────────────────────────────────
  static async createRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createRequestSchema.parse(req.body);
      const result = await PrivilegeRequestsService.createRequest(toActor(req), input);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /privileges/my ──────────────────────────────────────────────────────
  static async listMyRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = listFiltersSchema.parse(req.query);
      const result = await PrivilegeRequestsService.listRequests(filters, {
        requesterId: req.user!.id,
        ...(filters.status ? { status: filters.status } : {}),
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /privileges/my/effective ────────────────────────────────────────────
  static async getMyEffective(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PrivilegesService.getEffectivePrivileges(req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /privileges/pending ─────────────────────────────────────────────────
  static async listPending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = listFiltersSchema.parse(req.query);
      const actor = req.user!;

      // DEPT_ADMINs only review requests raised inside their own department.
      const scope =
        actor.role === "SYSTEM_ADMIN"
          ? {}
          : { requiredRole: "DEPT_ADMIN", departmentId: actor.departmentId ?? null };

      const result = await PrivilegeRequestsService.listRequests(filters, {
        status: "PENDING",
        ...scope,
        ...(filters.userId ? { requesterId: filters.userId } : {}),
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /privileges/:id/approve ────────────────────────────────────────────
  static async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { note } = reviewRequestSchema.parse(req.body ?? {});
      const result = await PrivilegeRequestsService.approveRequest(
        toActor(req),
        req.params.id as string,
        note,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /privileges/:id/reject ─────────────────────────────────────────────
  static async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { note } = rejectRequestSchema.parse(req.body);
      const result = await PrivilegeRequestsService.rejectRequest(
        toActor(req),
        req.params.id as string,
        note,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /privileges/:id/cancel ─────────────────────────────────────────────
  static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PrivilegeRequestsService.cancelRequest(
        toActor(req),
        req.params.id as string,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
