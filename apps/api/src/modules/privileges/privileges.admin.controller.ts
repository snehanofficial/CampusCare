import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { sendSuccess } from "../../middleware/response.js";
import { PrivilegesService } from "./privileges.service.js";
import { PrivilegesRepository } from "./privileges.repository.js";
import { toActor } from "./privileges.controller.js";
import { invalidateHydrationCache } from "./privileges.middleware.js";
import { grantAccessSchema, listFiltersSchema, revokeGrantSchema } from "./privileges.schema.js";

/** Only GTPE-issued rows are surfaced; MANUAL overrides stay owned by users module. */
const GTPE_SOURCES = ["GTPE_GRANT", "GTPE_REQUEST", "GTPE_TEMPLATE"];

function buildGrantWhere(
  req: Request,
  statuses: string[],
): Prisma.UserPermissionWhereInput {
  const search = req.query.search?.toString();
  const userId = req.query.userId?.toString();
  return {
    source: { in: GTPE_SOURCES },
    status: { in: statuses },
    ...(userId ? { userId } : {}),
    ...(search
      ? {
          OR: [
            { user: { email: { contains: search, mode: "insensitive" as const } } },
            { user: { firstName: { contains: search, mode: "insensitive" as const } } },
            { user: { lastName: { contains: search, mode: "insensitive" as const } } },
            { permission: { code: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
}

export class PrivilegesAdminController {
  // ── POST /privileges/grant ──────────────────────────────────────────────────
  static async grant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = grantAccessSchema.parse(req.body);
      const result = await PrivilegesService.grantAccess(toActor(req), input);
      invalidateHydrationCache(input.userId);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /privileges/active ──────────────────────────────────────────────────
  static async listActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = listFiltersSchema.parse(req.query);
      const where: Prisma.UserPermissionWhereInput = {
        ...buildGrantWhere(req, ["ACTIVE"]),
        expiresAt: { gt: new Date() },
      };
      const result = await PrivilegesService.listGrants(filters, where);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /privileges/history (supports ?format=csv) ──────────────────────────
  static async listHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = listFiltersSchema.parse(req.query);
      const statuses = filters.status ? [filters.status] : ["ACTIVE", "EXPIRED", "REVOKED"];
      const where = buildGrantWhere(req, statuses);

      if (req.query.format === "csv") {
        const { rows } = await PrivilegesRepository.findGrants({ where, take: 5000 });
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="temporary-access-history.csv"');
        res.status(200).send(PrivilegesService.buildHistoryCsv(rows));
        return;
      }

      const result = await PrivilegesService.listGrants(filters, where);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /privileges/grants/:grantId/revoke ─────────────────────────────────
  static async revoke(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = revokeGrantSchema.parse(req.body);
      const result = await PrivilegesService.revokeGrant(
        toActor(req),
        req.params.grantId as string,
        input,
      );
      invalidateHydrationCache(result.userId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
