import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller.js";
import { authenticate } from "../../../middleware/authenticate.js";
import { authorize } from "../../../middleware/authorize.js";
// Dummy middleware for file upload
import multer from "multer";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.use(authenticate);

// Reports
router.get("/reports/snapshot", authorize("inventory:read"), InventoryController.getStockSnapshot);
router.get("/reports/movement", authorize("inventory:read"), InventoryController.getStockMovementHistory);
router.get("/reports/low-stock", authorize("inventory:read"), InventoryController.getLowStockReport);

// Exports / Imports
router.get("/export/csv", authorize("inventory:read"), InventoryController.exportCSV);
router.get("/export/csv-template", authorize("inventory:read"), InventoryController.downloadCSVTemplate);
router.post("/import/validate", authorize("inventory:manage"), upload.single("file"), InventoryController.validateCSVImport);

// Alerts
router.get("/alerts/summary", authorize("inventory:read"), InventoryController.getAlertSummary);
router.post("/automation/detect-low-stock", authorize("inventory:write"), InventoryController.detectLowStock);
router.post("/automation/detect-critical-stock", authorize("inventory:write"), InventoryController.detectCriticalStock);

// Dashboard
router.get("/dashboard/summary", authorize("inventory:read"), InventoryController.getDashboard);

// Bulk Operations
router.post("/bulk/stock-in", authorize("inventory:manage"), InventoryController.bulkStockIn);
router.post("/bulk/stock-out", authorize("inventory:manage"), InventoryController.bulkStockOut);
router.post("/bulk/stock-adjust", authorize("inventory:manage"), InventoryController.bulkStockAdjust);
router.post("/bulk/soft-delete", authorize("inventory:manage"), InventoryController.bulkSoftDelete);

// Transactions
router.get("/transactions", authorize("inventory:read"), InventoryController.getAllTransactions);

// Reservations
router.get("/reservations", authorize("inventory:read"), InventoryController.listReservations);
router.post("/reservations/:reservationId/release", authorize("inventory:write"), InventoryController.releaseReservation);

// Item Specific Operations
router.post("/:id/stock-in", authorize("inventory:write"), InventoryController.stockIn);
router.post("/:id/stock-out", authorize("inventory:write"), InventoryController.stockOut);
router.post("/:id/stock-adjust", authorize("inventory:manage"), InventoryController.stockAdjust);
router.post("/:id/consume", authorize("inventory:write"), InventoryController.consumeForMaintenance);
router.post("/:id/reserve", authorize("inventory:write"), InventoryController.reserveStock);
router.get("/:id/transactions", authorize("inventory:read"), InventoryController.getTransactions);

// CRUD Operations
router.get("/", authorize("inventory:read"), InventoryController.list);
router.get("/:id", authorize("inventory:read"), InventoryController.get);
router.post("/", authorize("inventory:manage"), InventoryController.create);
router.put("/:id", authorize("inventory:manage"), InventoryController.update);
router.delete("/:id", authorize("inventory:manage"), InventoryController.softDelete);

export default router;
