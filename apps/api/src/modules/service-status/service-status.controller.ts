import { Request, Response, NextFunction } from "express";
import { ServiceStatusService } from "./service-status.service.js";
import { sendSuccess } from "../../middleware/response.js";
import { ServiceStatus } from "./service-status.types.js";
import { NotFoundError } from "../../utils/errors.js";

export class ServiceStatusController {
  static async getServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ServiceStatusService.getServices();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getServiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const result = await ServiceStatusService.getServiceById(id);
      if (!result) {
        throw new NotFoundError("Campus service not found");
      }
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { status, reason } = req.body;
      const changedBy = req.user?.email || "SYSTEM";

      const result = await ServiceStatusService.updateStatus(
        id,
        status as ServiceStatus,
        reason,
        changedBy
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async createMaintenanceWindow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { title, description, startTime, endTime } = req.body;

      const result = await ServiceStatusService.createMaintenanceWindow(id, {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      });
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const result = await ServiceStatusService.getHistory(id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async calculateAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ServiceStatusService.calculateAvailability();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
export default ServiceStatusController;
