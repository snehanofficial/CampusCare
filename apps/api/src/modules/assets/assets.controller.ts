import { Request, Response, NextFunction } from "express";
import { AssetsService } from "./assets.service.js";
import { sendSuccess } from "../../middleware/response.js";

export class AssetsController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AssetsService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
