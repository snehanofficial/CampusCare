import { Request, Response, NextFunction } from "express";
import { KnowledgeBaseService } from "./knowledge-base.service.js";
import { sendSuccess } from "../../middleware/response.js";

export class KnowledgeBaseController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await KnowledgeBaseService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
