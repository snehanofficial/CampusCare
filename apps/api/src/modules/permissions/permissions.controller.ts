import { Request, Response, NextFunction } from "express";
import { PermissionsService } from "./permissions.service.js";
import { sendSuccess } from "../../middleware/response.js";

export class PermissionsController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PermissionsService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
