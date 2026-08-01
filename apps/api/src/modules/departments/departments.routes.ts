import { Router } from "express";
import { DepartmentsController } from "./departments.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

export const departmentsRouter = Router();

/**
 * @swagger
 * /api/v1/departments:
 *   get:
 *     summary: Retrieve list of departments
 *     tags: [Departments]
 *     responses:
 *       200:
 *         description: Operation successful
 */
departmentsRouter.get("/", authenticate, DepartmentsController.list);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   get:
 *     summary: Get department details by ID
 *     tags: [Departments]
 *     responses:
 *       200:
 *         description: Operation successful
 */
departmentsRouter.get("/:id", authenticate, DepartmentsController.getById);

/**
 * @swagger
 * /api/v1/departments:
 *   post:
 *     summary: Create a new department
 *     tags: [Departments]
 *     responses:
 *       201:
 *         description: Department created successfully
 */
departmentsRouter.post("/", authenticate, authorize("departments:manage"), DepartmentsController.create);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   put:
 *     summary: Update an existing department
 *     tags: [Departments]
 *     responses:
 *       200:
 *         description: Department updated successfully
 */
departmentsRouter.put("/:id", authenticate, authorize("departments:manage"), DepartmentsController.update);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   delete:
 *     summary: Delete a department
 *     tags: [Departments]
 *     responses:
 *       200:
 *         description: Department deleted successfully
 */
departmentsRouter.delete("/:id", authenticate, authorize("departments:manage"), DepartmentsController.delete);
