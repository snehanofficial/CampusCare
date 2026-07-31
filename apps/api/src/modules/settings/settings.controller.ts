import { Request, Response, NextFunction } from "express";
import { SettingsService } from "./settings.service.js";
import { sendSuccess } from "../../middleware/response.js";

export class SettingsController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SettingsService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
