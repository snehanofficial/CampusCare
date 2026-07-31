import { Request, Response, NextFunction } from "express";
import { RolesService } from "./roles.service.js";
import { sendSuccess } from "../../middleware/response.js";

export class RolesController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await RolesService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
