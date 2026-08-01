import { Request, Response, NextFunction } from "express";
import { SlaService } from "./sla.service.js";
import { sendSuccess } from "../../middleware/response.js";
import { createSlaPolicySchema, updateSlaPolicySchema } from "./sla.schema.js";

export class SlaController {
  // ── GET /sla ──────────────────────────────────────────────────────────────────
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SlaService.getSlaComplianceReport();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /sla/policies ────────────────────────────────────────────────────────
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isActive = req.query.isActive?.toString();
      const result = await SlaService.listPolicies({ isActive });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /sla/policies/:id ────────────────────────────────────────────────────
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await SlaService.getPolicyById(id as string);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /sla/policies ───────────────────────────────────────────────────────
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createSlaPolicySchema.parse(req.body);
      const result = await SlaService.createPolicy(input);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  // ── PUT /sla/policies/:id ────────────────────────────────────────────────────
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = updateSlaPolicySchema.parse(req.body);
      const result = await SlaService.updatePolicy(id as string, input);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── DELETE /sla/policies/:id ─────────────────────────────────────────────────
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await SlaService.deletePolicy(id as string);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /sla/compliance ──────────────────────────────────────────────────────
  static async getCompliance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SlaService.getSlaComplianceReport();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /sla/check-violations ───────────────────────────────────────────────
  static async checkViolations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SlaService.checkSlaViolations();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
