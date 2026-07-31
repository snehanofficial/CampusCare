import { Request, Response, NextFunction } from "express";
import { InventoryService } from "./inventory.service.js";
import { sendSuccess } from "../../middleware/response.js";

export class InventoryController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InventoryService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
