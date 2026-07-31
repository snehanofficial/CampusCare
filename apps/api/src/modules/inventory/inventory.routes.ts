import { Router } from "express";
import { InventoryController } from "./inventory.controller.js";

export const inventoryRouter = Router();

/**
 * @swagger
 * /api/v1/inventory:
 *   get:
 *     summary: Retrieve summary for inventory
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: Operation successful
 */
inventoryRouter.get("/", InventoryController.getSummary);
