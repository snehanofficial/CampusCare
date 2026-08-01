import { Router } from "express";
import { MaintenanceController } from "./maintenance.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

export const maintenanceRouter = Router();

// Apply auth middleware to all routes in this module
maintenanceRouter.use(authenticate);

// Dashboard KPI overview
maintenanceRouter.get(
  "/dashboard/summary",
  authorize("assets:read"),
  MaintenanceController.getSummary
);

// Get list of active technicians
maintenanceRouter.get(
  "/technicians",
  authorize("assets:read"),
  MaintenanceController.getTechnicians
);

// List schedules
maintenanceRouter.get(
  "/schedules",
  authorize("assets:read"),
  MaintenanceController.listSchedules
);

// Create new schedule (which auto-creates the first scheduled record)
maintenanceRouter.post(
  "/schedules",
  authorize("assets:update"),
  MaintenanceController.createSchedule
);

// Trigger manual run of background automation checks
maintenanceRouter.post(
  "/automation/trigger",
  authorize("assets:update"),
  MaintenanceController.triggerAutomation
);

// List maintenance records (with paginated search/filters)
maintenanceRouter.get(
  "/",
  authorize("assets:read"),
  MaintenanceController.list
);

// Get details of a single record
maintenanceRouter.get(
  "/:id",
  authorize("assets:read"),
  MaintenanceController.get
);

// Assign technician to a record
maintenanceRouter.post(
  "/:id/assign",
  authorize("assets:update"),
  MaintenanceController.assign
);

// Start execution of record
maintenanceRouter.post(
  "/:id/start",
  authorize("assets:update"),
  MaintenanceController.start
);

// Complete record execution
maintenanceRouter.post(
  "/:id/complete",
  authorize("assets:update"),
  MaintenanceController.complete
);

// Cancel record execution
maintenanceRouter.post(
  "/:id/cancel",
  authorize("assets:update"),
  MaintenanceController.cancel
);

export default maintenanceRouter;
