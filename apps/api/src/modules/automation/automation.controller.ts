import { Request, Response, NextFunction } from "express";
import { AutomationService } from "./automation.service.js";
import { sendSuccess } from "../../middleware/response.js";

export class AutomationController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AutomationService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
