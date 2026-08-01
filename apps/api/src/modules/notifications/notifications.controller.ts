import { Request, Response, NextFunction } from "express";
import { NotificationsService } from "./notifications.service.js";
import { sendSuccess } from "../../middleware/response.js";
import { UnauthorizedError } from "../../utils/errors.js";

export class NotificationsController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { page, limit, isRead, category, search } = req.query;

      const filters: any = {};
      if (page) filters.page = Number(page);
      if (limit) filters.limit = Number(limit);
      if (category) filters.category = String(category);
      if (search) filters.search = String(search);
      if (isRead !== undefined) {
        filters.isRead = isRead === "true";
      }

      const result = await NotificationsService.list(req.user.id, filters);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const result = await NotificationsService.markAsRead(req.user.id, req.params.id as string);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      await NotificationsService.markAllAsRead(req.user.id);
      sendSuccess(res, { success: true });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      await NotificationsService.delete(req.user.id, req.params.id as string);
      sendSuccess(res, { success: true });
    } catch (err) {
      next(err);
    }
  }

  static async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const result = await NotificationsService.getPreferences(req.user.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const result = await NotificationsService.updatePreferences(
        req.user.id,
        req.body.preferences
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async broadcast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      await NotificationsService.broadcast(req.body);
      sendSuccess(res, { success: true });
    } catch (err) {
      next(err);
    }
  }
  static async testPush(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { title, message, url } = req.body;
      
      const { PushService } = await import("../push/push.service.js");
      
      await PushService.sendToUser(req.user.id, {
        title: title || "CampusCare Test",
        message: message || "Push notification working successfully",
        actionUrl: url || "/dashboard",
        category: "SYSTEM",
        type: "INFO",
      });

      sendSuccess(res, { success: true });
    } catch (err) {
      next(err);
    }
  }
}

