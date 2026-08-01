import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../middleware/response.js";
import { PrivilegeTemplatesService } from "./privileges.templates.service.js";
import { toActor } from "./privileges.controller.js";
import {
  createPolicySchema,
  createTemplateSchema,
  updatePolicySchema,
  updateTemplateSchema,
} from "./privileges.schema.js";

export class PrivilegeTemplatesController {
  // ── GET /privileges/templates ───────────────────────────────────────────────
  static async listTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PrivilegeTemplatesService.listTemplates(
        req.query.includeInactive === "true",
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /privileges/templates ──────────────────────────────────────────────
  static async createTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createTemplateSchema.parse(req.body);
      const result = await PrivilegeTemplatesService.createTemplate(toActor(req), input);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  // ── PUT /privileges/templates/:id ───────────────────────────────────────────
  static async updateTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updateTemplateSchema.parse(req.body);
      const result = await PrivilegeTemplatesService.updateTemplate(
        toActor(req),
        req.params.id as string,
        input,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── DELETE /privileges/templates/:id (soft delete) ──────────────────────────
  static async deleteTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PrivilegeTemplatesService.deleteTemplate(
        toActor(req),
        req.params.id as string,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /privileges/policies ────────────────────────────────────────────────
  static async listPolicies(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PrivilegeTemplatesService.listPolicies();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /privileges/policies ───────────────────────────────────────────────
  static async createPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createPolicySchema.parse(req.body);
      const result = await PrivilegeTemplatesService.createPolicy(toActor(req), input);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  // ── PUT /privileges/policies/:id ────────────────────────────────────────────
  static async updatePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updatePolicySchema.parse(req.body);
      const result = await PrivilegeTemplatesService.updatePolicy(
        toActor(req),
        req.params.id as string,
        input,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
