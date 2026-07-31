import { Request, Response, NextFunction } from "express";
import { CategoriesService } from "./categories.service.js";
import { sendSuccess } from "../../middleware/response.js";

export class CategoriesController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await CategoriesService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
