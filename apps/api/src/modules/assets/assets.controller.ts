import { Request, Response, NextFunction } from "express";
import { AssetsService } from "./assets.service.js";
import { sendSuccess } from "../../middleware/response.js";
import {
  assetCreateSchema,
  assetCategoryCreateSchema,
  bulkActionSchema,
  procurementCreateSchema,
  assetAssignSchema,
  assetTransferSchema,
  assetLifecycleSchema
} from "@campuscare/shared-schemas";
import { ProcurementService } from "./services/procurement.service.js";
import { AssetAssignmentService } from "./services/asset-assignment.service.js";
import { AssetLifecycleService } from "./services/asset-lifecycle.service.js";
import { ProcurementStatus } from "@campuscare/shared-types";

export class AssetsController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as any | undefined;
      const lifecycleStage = req.query.lifecycleStage as any | undefined;
      const healthStatus = req.query.healthStatus as any | undefined;
      const categoryId = req.query.categoryId as string | undefined;
      const departmentId = req.query.departmentId as string | undefined;
      const building = req.query.building as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined;

      const result = await AssetsService.list({
        search,
        status,
        lifecycleStage,
        healthStatus,
        categoryId,
        departmentId,
        building,
        page,
        pageSize
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AssetsService.get(req.params.id as string);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = assetCreateSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const result = await AssetsService.create(validated, userId);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = assetCreateSchema.partial().parse(req.body);
      const userId = (req as any).user?.id;
      const result = await AssetsService.update(req.params.id as string, validated, userId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      await AssetsService.delete(req.params.id as string, userId);
      sendSuccess(res, { success: true, message: "Asset successfully soft-deleted." });
    } catch (err) {
      next(err);
    }
  }

  // Categories Controller Handlers
  static async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AssetsService.listCategories();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = assetCategoryCreateSchema.parse(req.body);
      const result = await AssetsService.createCategory(validated);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = assetCategoryCreateSchema.parse(req.body);
      const result = await AssetsService.updateCategory(req.params.id as string, validated);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AssetsService.deleteCategory(req.params.id as string);
      sendSuccess(res, { success: true, message: "Asset category deactivated." });
    } catch (err) {
      next(err);
    }
  }

  // Bulk Operations Handlers
  static async bulkAction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = bulkActionSchema.parse(req.body);
      const userId = (req as any).user?.id;
      let result;

      switch (validated.action) {
        case "validate":
          if (!validated.assets) throw new Error("Assets list is required for validation");
          result = await AssetsService.bulkValidate(validated.assets);
          break;
        case "create":
          if (!validated.assets) throw new Error("Assets list is required for creation");
          result = await AssetsService.bulkCreate(validated.assets, userId);
          break;
        case "update":
          if (!validated.assets) throw new Error("Assets list is required for updates");
          result = await AssetsService.bulkUpdate(validated.assets, userId);
          break;
        case "assign":
          if (!validated.assetIds || !validated.payload?.departmentId || !validated.payload?.location) {
            throw new Error("assetIds, departmentId, and location are required for bulk assignment");
          }
          result = await AssetsService.bulkAssign(
            validated.assetIds,
            validated.payload.departmentId,
            validated.payload.location,
            userId
          );
          break;
        case "transfer":
          if (!validated.assetIds || !validated.payload?.departmentId || !validated.payload?.location) {
            throw new Error("assetIds, departmentId, and location are required for bulk transfer");
          }
          result = await AssetsService.bulkTransfer(
            validated.assetIds,
            validated.payload.departmentId,
            validated.payload.location,
            userId
          );
          break;
        case "retire":
          if (!validated.assetIds) throw new Error("assetIds are required for bulk retirement");
          result = await AssetsService.bulkRetire(
            validated.assetIds,
            validated.payload?.notes || "Bulk retirement",
            userId
          );
          break;
        case "qr":
          if (!validated.assetIds) throw new Error("assetIds are required for bulk QR generation");
          result = await AssetsService.bulkGenerateQR(validated.assetIds, userId);
          break;
        default:
          throw new Error("Unknown bulk action");
      }

      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // Phase 2 Procurement handlers
  static async listProcurements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as ProcurementStatus | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined;

      const result = await ProcurementService.list({ search, status, page, pageSize });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getProcurement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProcurementService.get(req.params.id as string);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async createProcurement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = procurementCreateSchema.parse(req.body);
      const result = await ProcurementService.create(validated);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateProcurement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = procurementCreateSchema.partial().parse(req.body);
      const result = await ProcurementService.update(req.params.id as string, validated);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async deleteProcurement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ProcurementService.delete(req.params.id as string);
      sendSuccess(res, { success: true, message: "Procurement request deleted." });
    } catch (err) {
      next(err);
    }
  }

  static async registerProcurementAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      // Simple parse of payload body (expecting assets array)
      const result = await ProcurementService.registerAssets(req.params.id as string, req.body, userId);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  // Phase 2 Assignment / Lifecycle handlers
  static async assignAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = assetAssignSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const result = await AssetAssignmentService.assign(req.params.id as string, validated, userId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async returnAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const result = await AssetAssignmentService.returnAsset(req.params.id as string, req.body, userId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async transferAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = assetTransferSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const result = await AssetLifecycleService.transfer(req.params.id as string, validated, userId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async changeAssetLifecycle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = assetLifecycleSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const result = await AssetLifecycleService.changeLifecycle(req.params.id as string, validated as any, userId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
