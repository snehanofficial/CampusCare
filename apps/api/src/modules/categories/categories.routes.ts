import { Router } from "express";
import { CategoriesController } from "./categories.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

export const categoriesRouter = Router();

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Retrieve list of categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Operation successful
 */
categoriesRouter.get("/", authenticate, CategoriesController.list);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Get category details by ID
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Operation successful
 */
categoriesRouter.get("/:id", authenticate, CategoriesController.getById);

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     responses:
 *       201:
 *         description: Category created successfully
 */
categoriesRouter.post("/", authenticate, authorize("categories:manage"), CategoriesController.create);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   put:
 *     summary: Update an existing category
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
categoriesRouter.put("/:id", authenticate, authorize("categories:manage"), CategoriesController.update);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Category deleted successfully
 */
categoriesRouter.delete("/:id", authenticate, authorize("categories:manage"), CategoriesController.delete);
