import { Request, Response, NextFunction } from "express";
import { UsersService } from "./users.service.js";
import { sendSuccess } from "../../middleware/response.js";
import { createUserSchema, updateUserSchema } from "./users.schema.js";

export class UsersController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await UsersService.getSummary();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search?.toString();
      const role = req.query.role?.toString();
      const status = req.query.status?.toString();
      const page = req.query.page ? parseInt(req.query.page.toString(), 10) : undefined;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize.toString(), 10) : undefined;

      const result = await UsersService.listUsers({
        search,
        role,
        status,
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
      const user = await UsersService.getUserById(id as string);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedInput = createUserSchema.parse(req.body);
      const user = await UsersService.createUser(parsedInput);
      sendSuccess(res, user, 201, "User created successfully");
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const parsedInput = updateUserSchema.parse(req.body);
      const user = await UsersService.updateUser(id as string, parsedInput);
      sendSuccess(res, user, 200, "User updated successfully");
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await UsersService.deleteUser(id as string);
      const message = result.deactivated
        ? "User has history and was deactivated instead of deleted"
        : "User deleted successfully";
      sendSuccess(res, result, 200, message);
    } catch (err) {
      next(err);
    }
  }
}
