import { Request, Response, NextFunction } from "express";
import { AutomationService } from "./automation.service.js";
import { sendSuccess } from "../../middleware/response.js";
import { createRuleSchema, updateRuleSchema } from "./automation.schema.js";

function parseIntParam(val: string | undefined): number | undefined {
  if (!val) return undefined;
  const n = parseInt(val, 10);
  return isNaN(n) ? undefined : n;
}

export class AutomationController {
  // ── GET /automation/summary ──────────────────────────────────────────────────
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AutomationService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /automation/rules ─────────────────────────────────────────────────────
  static async listRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AutomationService.listRules({
        search: req.query.search?.toString(),
        isActive: req.query.isActive?.toString(),
        trigger: req.query.trigger?.toString(),
        page: parseIntParam(req.query.page?.toString()),
        pageSize: parseIntParam(req.query.pageSize?.toString()),
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /automation/rules/:id ─────────────────────────────────────────────────
  static async getRuleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const rule = await AutomationService.getRuleById(id as string);
      sendSuccess(res, rule);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /automation/rules ────────────────────────────────────────────────────
  static async createRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createRuleSchema.parse(req.body);
      const rule = await AutomationService.createRule(input);
      sendSuccess(res, rule, 201);
    } catch (err) {
      next(err);
    }
  }

  // ── PUT /automation/rules/:id ─────────────────────────────────────────────────
  static async updateRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = updateRuleSchema.parse(req.body);
      const rule = await AutomationService.updateRule(id as string, input);
      sendSuccess(res, rule);
    } catch (err) {
      next(err);
    }
  }

  // ── DELETE /automation/rules/:id ──────────────────────────────────────────────
  static async deleteRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AutomationService.deleteRule(id as string);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /automation/logs ──────────────────────────────────────────────────────
  static async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AutomationService.getLogs({
        ruleId: req.query.ruleId?.toString(),
        ticketId: req.query.ticketId?.toString(),
        page: parseIntParam(req.query.page?.toString()),
        pageSize: parseIntParam(req.query.pageSize?.toString()),
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
