import { Router } from "express";
import { AssetsController } from "./assets.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { initHealthEventListeners } from "./events/health-listener.js";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

// Initialize health engine event listeners
initHealthEventListeners();

export const assetsRouter = Router();

// Import / Export routes
assetsRouter.get(
  "/export",
  authenticate,
  authorize("assets:read"),
  AssetsController.exportAssets
);

assetsRouter.get(
  "/import/template",
  authenticate,
  authorize("assets:read"),
  AssetsController.downloadTemplate
);

assetsRouter.post(
  "/import/validate",
  authenticate,
  authorize("assets:create"),
  upload.single("file"),
  AssetsController.importValidate
);

assetsRouter.post(
  "/import/commit",
  authenticate,
  authorize("assets:create"),
  AssetsController.importCommit
);


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

// Procurement routes (placed above /:id to prevent routing conflict)
assetsRouter.get(
  "/procurements",
  authenticate,
  authorize("assets:read"),
  AssetsController.listProcurements
);

assetsRouter.get(
  "/procurements/:id",
  authenticate,
  authorize("assets:read"),
  AssetsController.getProcurement
);

assetsRouter.post(
  "/procurements",
  authenticate,
  authorize("assets:create"),
  AssetsController.createProcurement
);

assetsRouter.put(
  "/procurements/:id",
  authenticate,
  authorize("assets:update"),
  AssetsController.updateProcurement
);

assetsRouter.delete(
  "/procurements/:id",
  authenticate,
  authorize("assets:delete"),
  AssetsController.deleteProcurement
);

assetsRouter.post(
  "/procurements/:id/register",
  authenticate,
  authorize("assets:create"),
  AssetsController.registerProcurementAssets
);

// Bulk operations
assetsRouter.post(
  "/bulk",
  authenticate,
  authorize("assets:update"),
  AssetsController.bulkAction
);

// Health & Heatmap operations
assetsRouter.get(
  "/health/dashboard",
  authenticate,
  authorize("assets:read"),
  AssetsController.getHealthDashboard
);

assetsRouter.get(
  "/health/heatmap",
  authenticate,
  authorize("assets:read"),
  AssetsController.getHeatmap
);

assetsRouter.get(
  "/health/config",
  authenticate,
  authorize("assets:read"),
  AssetsController.getHealthConfig
);

assetsRouter.post(
  "/health/config",
  authenticate,
  authorize("assets:update"),
  AssetsController.updateHealthConfig
);

assetsRouter.post(
  "/health/recalculate",
  authenticate,
  authorize("assets:update"),
  AssetsController.recalculateAllHealth
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

// Phase 2 Assignment / Lifecycle endpoints
assetsRouter.post(
  "/:id/assign",
  authenticate,
  authorize("assets:update"),
  AssetsController.assignAsset
);

assetsRouter.post(
  "/:id/return",
  authenticate,
  authorize("assets:update"),
  AssetsController.returnAsset
);

assetsRouter.post(
  "/:id/transfer",
  authenticate,
  authorize("assets:update"),
  AssetsController.transferAsset
);

assetsRouter.post(
  "/:id/lifecycle",
  authenticate,
  authorize("assets:update"),
  AssetsController.changeAssetLifecycle
);
