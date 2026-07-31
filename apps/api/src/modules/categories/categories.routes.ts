import { Router } from "express";
import { CategoriesController } from "./categories.controller.js";

export const categoriesRouter = Router();

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Retrieve summary for categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Operation successful
 */
categoriesRouter.get("/", CategoriesController.getSummary);
