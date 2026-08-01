import { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "./analytics.service.js";
import { sendSuccess } from "../../middleware/response.js";
import { prisma } from "../../database/prisma.js";


export class AnalyticsController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = req.user!.role;
      if (role === "SYSTEM_ADMIN") {
        const result = await AnalyticsService.getAdminDashboard();
        sendSuccess(res, result);
        return;
      }
      if (role === "TECHNICIAN") {
        const result = await AnalyticsService.getTechnicianDashboard(req.user!.id);
        sendSuccess(res, result);
        return;
      }
      const result = await AnalyticsService.getStudentDashboard(req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getStudentDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AnalyticsService.getStudentDashboard(req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getTechnicianDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AnalyticsService.getTechnicianDashboard(req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getDepartmentDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Find user department
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { departmentId: true }
      });
      if (!user?.departmentId) {
        res.status(400).json({ success: false, error: { message: "User is not associated with any department" } });
        return;
      }
      const result = await AnalyticsService.getDepartmentDashboard(user.departmentId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getAdminDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AnalyticsService.getAdminDashboard();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getCharts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AnalyticsService.getChartsData();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

