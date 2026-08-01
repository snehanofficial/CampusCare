import type { Request, Response, NextFunction } from "express";
import { InventoryService } from "../services/inventory.service.js";
import { sendSuccess } from "../../../middleware/response.js";
import {
  inventoryItemCreateSchema,
  inventoryItemUpdateSchema,
  stockInSchema,
  stockOutSchema,
  stockAdjustmentSchema,
  maintenanceConsumptionSchema,
  reserveStockSchema,
  releaseReservationSchema,
  bulkStockInSchema,
  bulkStockOutSchema,
  bulkStockAdjustSchema,
  bulkSoftDeleteSchema,
  inventoryListQuerySchema,
  inventoryTransactionListQuerySchema,
  inventoryBulkImportRowSchema
} from "@campuscare/shared-schemas";
import fs from "fs";
import { ImportExportHelper } from "../../../utils/import-export.js";
import { prisma } from "../../../database/prisma.js";


export class InventoryController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = inventoryListQuerySchema.parse(req.query);
      const result = await InventoryService.list(query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.get(req.params.id as string);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = inventoryItemCreateSchema.parse(req.body);
      const result = await InventoryService.create(data, req.user!.id);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = inventoryItemUpdateSchema.parse(req.body);
      const result = await InventoryService.update(req.params.id as string, data, req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async softDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.softDelete(req.params.id as string, req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async stockIn(req: Request, res: Response, next: NextFunction) {
    try {
      const data = stockInSchema.parse(req.body);
      const result = await InventoryService.stockIn(req.params.id as string, data, req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async stockOut(req: Request, res: Response, next: NextFunction) {
    try {
      const data = stockOutSchema.parse(req.body);
      const result = await InventoryService.stockOut(req.params.id as string, data, req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async stockAdjust(req: Request, res: Response, next: NextFunction) {
    try {
      const data = stockAdjustmentSchema.parse(req.body);
      const result = await InventoryService.stockAdjust(req.params.id as string, data, req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async consumeForMaintenance(req: Request, res: Response, next: NextFunction) {
    try {
      const data = maintenanceConsumptionSchema.parse(req.body);
      const result = await InventoryService.consumeForMaintenance(req.params.id as string, data, req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async reserveStock(req: Request, res: Response, next: NextFunction) {
    try {
      const data = reserveStockSchema.parse(req.body);
      const result = await InventoryService.reserveStock(req.params.id as string, data, req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async releaseReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = releaseReservationSchema.parse(req.body);
      const result = await InventoryService.releaseReservation(req.params.reservationId as string, data, req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async listReservations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.listReservations(req.query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const query = inventoryTransactionListQuerySchema.parse(req.query);
      const result = await InventoryService.getTransactions(req.params.id as string, query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getAllTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const query = inventoryTransactionListQuerySchema.parse(req.query);
      const result = await InventoryService.getAllTransactions(query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async bulkStockIn(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulkStockInSchema.parse(req.body);
      const result = await InventoryService.bulkStockIn(data, req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async bulkStockOut(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulkStockOutSchema.parse(req.body);
      const result = await InventoryService.bulkStockOut(data, req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async bulkStockAdjust(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulkStockAdjustSchema.parse(req.body);
      const result = await InventoryService.bulkStockAdjust(data, req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async bulkSoftDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulkSoftDeleteSchema.parse(req.body);
      const result = await InventoryService.bulkSoftDelete(data, req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.getDashboardSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async detectLowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.detectLowStock();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async detectCriticalStock(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.detectCriticalStock();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getAlertSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.getAlertSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getStockSnapshot(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.getStockSnapshot();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getStockMovementHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const query = inventoryTransactionListQuerySchema.parse(req.query);
      const result = await InventoryService.getStockMovementHistory(query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getLowStockReport(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.getLowStockReport();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async exportCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const format = (req.query.format as "csv" | "xlsx") || "csv";
      const query = inventoryListQuerySchema.parse(req.query);
      const result = await InventoryService.list({ ...query, pageSize: 100000 });
      
      const exportData = result.data.map((item: any) => ({
        id: item.id,
        itemCode: item.itemCode,
        name: item.name,
        description: item.description || "",
        category: item.category,
        status: item.status,
        unit: item.unit,
        manufacturer: item.manufacturer || "",
        model: item.model || "",
        barcodeQr: item.barcodeQr || "",
        currentStock: item.currentStock,
        reservedStock: item.reservedStock,
        availableStock: item.availableStock,
        minimumStock: item.minimumStock,
        maximumStock: item.maximumStock,
        reorderLevel: item.reorderLevel,
        unitCost: item.unitCost ? Number(item.unitCost) : "",
        location: item.location || "",
        notes: item.notes || "",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));

      const buffer = ImportExportHelper.generateExport(exportData, format);
      res.setHeader("Content-Disposition", `attachment; filename="inventory-export.${format}"`);
      res.setHeader("Content-Type", format === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }

  static async downloadCSVTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const format = (req.query.format as "csv" | "xlsx") || "csv";
      const headers = [
        "name",
        "description",
        "category",
        "status",
        "unit",
        "manufacturer",
        "model",
        "barcodeQr",
        "currentStock",
        "minimumStock",
        "maximumStock",
        "reorderLevel",
        "unitCost",
        "location",
        "notes"
      ];
      const buffer = ImportExportHelper.generateTemplate(headers, format);
      res.setHeader("Content-Disposition", `attachment; filename="inventory-template.${format}"`);
      res.setHeader("Content-Type", format === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }

  static async validateCSVImport(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) throw new Error("No file uploaded");

      const buffer = fs.readFileSync(file.path);
      const rows = ImportExportHelper.parseBuffer(buffer);
      fs.unlinkSync(file.path);

      const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : undefined;
      const report = ImportExportHelper.validateRows(rows, inventoryBulkImportRowSchema, mapping);

      const validRowsChecked: any[] = [];
      // Perform DB duplicate checks for barcodeQr
      for (const row of report.validData) {
        const rowErrors: any[] = [];
        if (row.barcodeQr) {
          const dupBarcode = await prisma.inventoryItem.findFirst({
            where: { barcodeQr: row.barcodeQr, isActive: true }
          });
          if (dupBarcode) {
            rowErrors.push({ field: "barcodeQr", message: `Barcode/QR code '${row.barcodeQr}' already exists in inventory.` });
          }
        }
        if (rowErrors.length > 0) {
          report.failureCount++;
          report.successCount--;
          const approxRowIndex = report.validData.indexOf(row) + 1;
          rowErrors.forEach(e => {
            report.errors.push({
              row: approxRowIndex,
              field: e.field,
              value: (row as any)[e.field] || null,
              message: e.message
            });
          });
        } else {
          validRowsChecked.push(row);
        }
      }
      report.validData = validRowsChecked;

      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  }

  static async commitImport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { items } = req.body;
      if (!items || !Array.isArray(items)) {
        throw new Error("Invalid items array for import commit");
      }
      const result = await InventoryService.bulkCreate(items, userId);
      sendSuccess(res, { success: true, count: result.length, data: result });
    } catch (err) {
      next(err);
    }
  }
}

