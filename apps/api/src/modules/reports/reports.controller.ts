import { Request, Response, NextFunction } from "express";
import { ReportsService } from "./reports.service.js";
import { sendSuccess } from "../../middleware/response.js";
import type { ReportType, ExportFormat, ReportFilters } from "./reports.types.js";

export class ReportsController {
  /**
   * GET /api/v1/reports
   * Returns the catalog of available report types.
   */
  static async getAvailableReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = ReportsService.getAvailableReports();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/reports/history
   * Returns the in-memory generation history.
   */
  static async getReportHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = ReportsService.getReportHistory();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/reports/:type
   * Generate a report with optional query-string filters.
   */
  static async generateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.params.type as ReportType;
      const filters: ReportFilters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
        categoryId: req.query.categoryId as string | undefined,
        status: req.query.status as string | undefined,
        priority: req.query.priority as string | undefined,
        assigneeId: req.query.assigneeId as string | undefined,
      };

      const result = await ReportsService.generateReport(type, filters);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/reports/export
   * Generate a report and stream the file as a download attachment.
   */
  static async exportReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, format, filters } = req.body as {
        type: ReportType;
        format: ExportFormat;
        filters?: ReportFilters;
      };

      const generatedBy = req.user?.email ?? "SYSTEM";

      const { buffer, contentType, filename } = await ReportsService.exportReport(
        type,
        format,
        filters,
        generatedBy
      );

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);
      res.setHeader("Cache-Control", "no-store");
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }
}
