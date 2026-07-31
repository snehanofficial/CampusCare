import { Request, Response, NextFunction } from "express";
import { DepartmentsService } from "./departments.service.js";
import { sendSuccess } from "../../middleware/response.js";

export class DepartmentsController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await DepartmentsService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
