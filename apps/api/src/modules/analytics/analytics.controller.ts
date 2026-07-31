import { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "./analytics.service.js";
import { sendSuccess } from "../../middleware/response.js";

export class AnalyticsController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AnalyticsService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
