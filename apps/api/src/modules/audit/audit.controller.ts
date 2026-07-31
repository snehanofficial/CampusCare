import { Request, Response, NextFunction } from "express";
import { AuditService } from "./audit.service.js";
import { sendSuccess } from "../../middleware/response.js";

export class AuditController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuditService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
