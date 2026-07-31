import { Request, Response, NextFunction } from "express";
import { ReportsService } from "./reports.service.js";
import { sendSuccess } from "../../middleware/response.js";

export class ReportsController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ReportsService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
