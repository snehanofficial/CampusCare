import { Request, Response, NextFunction } from "express";
import { SlaService } from "./sla.service.js";
import { sendSuccess } from "../../middleware/response.js";

export class SlaController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SlaService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
