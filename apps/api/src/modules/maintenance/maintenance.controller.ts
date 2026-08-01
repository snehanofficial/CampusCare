import { Request, Response, NextFunction } from "express";
import { MaintenanceService } from "./maintenance.service.js";
import { sendSuccess } from "../../middleware/response.js";
import {
  maintenanceScheduleCreateSchema,
  assignTechnicianSchema,
  completeMaintenanceSchema,
  cancelMaintenanceSchema,
} from "@campuscare/shared-schemas";
import { z } from "zod";

export class MaintenanceController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined;
      const search = req.query.search as string | undefined;
      const status = req.query.status as any | undefined;
      const priority = req.query.priority as any | undefined;
      const type = req.query.type as any | undefined;
      const assetId = req.query.assetId as string | undefined;
      const technicianId = req.query.technicianId as string | undefined;

      const result = await MaintenanceService.listRecords({
        page,
        pageSize,
        search,
        status,
        priority,
        type,
        assetId,
        technicianId,
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async listSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assetId = req.query.assetId as string | undefined;
      const technicianId = req.query.technicianId as string | undefined;

      const result = await MaintenanceService.listSchedules({ assetId, technicianId });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await MaintenanceService.getRecord(req.params.id as string);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async createSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedBody = maintenanceScheduleCreateSchema.parse(req.body);
      const result = await MaintenanceService.createSchedule(validatedBody as any, req.user!.id);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  static async assign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedBody = assignTechnicianSchema.parse(req.body);
      const result = await MaintenanceService.assignTechnician(
        req.params.id as string,
        validatedBody.technicianId || null,
        validatedBody.clientUpdatedAt || null,
        req.user!.id
      );
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  static async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = z
        .object({ clientUpdatedAt: z.string().optional().nullable() })
        .parse(req.body);
      const result = await MaintenanceService.startMaintenance(
        req.params.id as string,
        parsed.clientUpdatedAt || null,
        req.user!.id
      );
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  static async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedBody = completeMaintenanceSchema.parse(req.body);
      const result = await MaintenanceService.completeMaintenance(
        req.params.id as string,
        validatedBody as any,
        req.user!.id
      );
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedBody = cancelMaintenanceSchema.parse(req.body);
      const result = await MaintenanceService.cancelMaintenance(
        req.params.id as string,
        validatedBody as any,
        req.user!.id
      );
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await MaintenanceService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getTechnicians(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await MaintenanceService.getTechnicians();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async triggerAutomation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await MaintenanceService.runAutomationChecks();
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }
}
export default MaintenanceController;
