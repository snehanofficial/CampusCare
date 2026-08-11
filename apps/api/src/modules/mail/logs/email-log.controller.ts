import { Request, Response, NextFunction } from "express";
import { EmailLogService } from "./email-log.service.js";
import { sendSuccess } from "../../../middleware/response.js";
import { NotFoundError, UnauthorizedError } from "../../../utils/errors.js";

export class EmailLogController {
  static async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;

      const result = await EmailLogService.getLogs({ page, limit, search, status });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getLogById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const log = await EmailLogService.getLogById(req.params.id as string);
      if (!log) {
        throw new NotFoundError("Email log not found");
      }

      sendSuccess(res, log);
    } catch (err) {
      next(err);
    }
  }
}
export default EmailLogController;
