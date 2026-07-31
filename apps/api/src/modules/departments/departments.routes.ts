import { Router } from "express";
import { DepartmentsController } from "./departments.controller.js";

export const departmentsRouter = Router();

/**
 * @swagger
 * /api/v1/departments:
 *   get:
 *     summary: Retrieve summary for departments
 *     tags: [Departments]
 *     responses:
 *       200:
 *         description: Operation successful
 */
departmentsRouter.get("/", DepartmentsController.getSummary);
