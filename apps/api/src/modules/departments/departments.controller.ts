import { Request, Response, NextFunction } from "express";
import { DepartmentsService } from "./departments.service.js";
import { sendSuccess } from "../../middleware/response.js";
import { createDepartmentSchema, updateDepartmentSchema } from "./departments.schema.js";

export class DepartmentsController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await DepartmentsService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search?.toString();
      const page = req.query.page ? parseInt(req.query.page.toString(), 10) : undefined;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize.toString(), 10) : undefined;

      const result = await DepartmentsService.listDepartments({
        search,
        page,
        pageSize,
      });

      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dept = await DepartmentsService.getDepartmentById(id as string);
      sendSuccess(res, dept);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedInput = createDepartmentSchema.parse(req.body);
      const dept = await DepartmentsService.createDepartment(parsedInput);
      sendSuccess(res, dept, 201);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const parsedInput = updateDepartmentSchema.parse(req.body);
      const dept = await DepartmentsService.updateDepartment(id as string, parsedInput);
      sendSuccess(res, dept, 200);
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await DepartmentsService.deleteDepartment(id as string);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }
}
