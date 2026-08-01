import { Request, Response, NextFunction } from "express";
import { IncidentsService } from "./incidents.service.js";
import { sendSuccess } from "../../middleware/response.js";
import { createIncidentSchema, updateIncidentSchema } from "./incidents.schema.js";

function parseIntParam(val: string | undefined): number | undefined {
  if (!val) return undefined;
  const n = parseInt(val, 10);
  return isNaN(n) ? undefined : n;
}

export class IncidentsController {
  // ── GET /incidents ────────────────────────────────────────────────────────────
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await IncidentsService.listIncidents({
        search: req.query.search?.toString(),
        status: req.query.status?.toString(),
        severity: req.query.severity?.toString(),
        page: parseIntParam(req.query.page?.toString()),
        pageSize: parseIntParam(req.query.pageSize?.toString()),
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /incidents/:id ────────────────────────────────────────────────────────
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const incident = await IncidentsService.getIncidentById(id as string);
      sendSuccess(res, incident);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /incidents ───────────────────────────────────────────────────────────
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createIncidentSchema.parse(req.body);
      const incident = await IncidentsService.createIncident(input);
      sendSuccess(res, incident, 201);
    } catch (err) {
      next(err);
    }
  }

  // ── PUT /incidents/:id ────────────────────────────────────────────────────────
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = updateIncidentSchema.parse(req.body);
      const incident = await IncidentsService.updateIncident(id as string, input);
      sendSuccess(res, incident);
    } catch (err) {
      next(err);
    }
  }

  // ── DELETE /incidents/:id ─────────────────────────────────────────────────────
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await IncidentsService.deleteIncident(id as string);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /incidents/:id/timeline ───────────────────────────────────────────────
  static async getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const timeline = await IncidentsService.getIncidentTimeline(id as string);
      sendSuccess(res, timeline);
    } catch (err) {
      next(err);
    }
  }
}

