import { Request, Response, NextFunction } from "express";
import { MaintenanceService } from "./maintenance.service.js";
import { sendSuccess } from "../../middleware/response.js";

export class MaintenanceController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await MaintenanceService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
