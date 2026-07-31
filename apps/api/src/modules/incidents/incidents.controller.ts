import { Request, Response, NextFunction } from "express";
import { IncidentsService } from "./incidents.service.js";
import { sendSuccess } from "../../middleware/response.js";

export class IncidentsController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await IncidentsService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
