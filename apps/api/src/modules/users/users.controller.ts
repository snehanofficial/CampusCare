import { Request, Response, NextFunction } from "express";
import { UsersService } from "./users.service.js";
import { sendSuccess } from "../../middleware/response.js";

export class UsersController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await UsersService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
