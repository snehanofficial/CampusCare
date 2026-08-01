import { Request, Response, NextFunction } from "express";
import { CategoriesService } from "./categories.service.js";
import { sendSuccess } from "../../middleware/response.js";
import { createCategorySchema, updateCategorySchema } from "./categories.schema.js";

export class CategoriesController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await CategoriesService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search?.toString();
      const active = req.query.active?.toString();
      const page = req.query.page ? parseInt(req.query.page.toString(), 10) : undefined;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize.toString(), 10) : undefined;

      const result = await CategoriesService.listCategories({
        search,
        active,
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
      const cat = await CategoriesService.getCategoryById(id as string);
      sendSuccess(res, cat);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedInput = createCategorySchema.parse(req.body);
      const cat = await CategoriesService.createCategory(parsedInput);
      sendSuccess(res, cat, 201);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const parsedInput = updateCategorySchema.parse(req.body);
      const cat = await CategoriesService.updateCategory(id as string, parsedInput);
      sendSuccess(res, cat, 200);
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await CategoriesService.deleteCategory(id as string);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }
}
