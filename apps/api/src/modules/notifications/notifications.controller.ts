import { Request, Response, NextFunction } from "express";
import { NotificationsService } from "./notifications.service.js";
import { sendSuccess } from "../../middleware/response.js";

export class NotificationsController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await NotificationsService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
