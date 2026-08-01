import { Router } from "express";
import { AssetsController } from "./assets.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

export const assetsRouter = Router();

// Categories routes (placed above /:id to prevent routing conflict)
assetsRouter.get(
  "/categories",
  authenticate,
  authorize("assets:read"),
  AssetsController.listCategories
);

assetsRouter.post(
  "/categories",
  authenticate,
  authorize("assets:create"),
  AssetsController.createCategory
);

assetsRouter.put(
  "/categories/:id",
  authenticate,
  authorize("assets:update"),
  AssetsController.updateCategory
);

assetsRouter.delete(
  "/categories/:id",
  authenticate,
  authorize("assets:delete"),
  AssetsController.deleteCategory
);

// Bulk operations
assetsRouter.post(
  "/bulk",
  authenticate,
  authorize("assets:update"),
  AssetsController.bulkAction
);

// Asset CRUD
assetsRouter.get(
  "/",
  authenticate,
  authorize("assets:read"),
  AssetsController.list
);

assetsRouter.get(
  "/:id",
  authenticate,
  authorize("assets:read"),
  AssetsController.get
);

assetsRouter.post(
  "/",
  authenticate,
  authorize("assets:create"),
  AssetsController.create
);

assetsRouter.put(
  "/:id",
  authenticate,
  authorize("assets:update"),
  AssetsController.update
);

assetsRouter.delete(
  "/:id",
  authenticate,
  authorize("assets:delete"),
  AssetsController.delete
);
