import { Request, Response, NextFunction } from "express";
import { TicketsService } from "./tickets.service.js";
import { sendSuccess } from "../../middleware/response.js";

export class TicketsController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TicketsService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
