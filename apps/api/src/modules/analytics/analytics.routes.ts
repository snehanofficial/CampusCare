import { Router } from "express";
import { AnalyticsController } from "./analytics.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";


export const analyticsRouter = Router();

analyticsRouter.get(
  "/student",
  authenticate,
  AnalyticsController.getStudentDashboard,
);

analyticsRouter.get(
  "/technician",
  authenticate,
  AnalyticsController.getTechnicianDashboard,
);

analyticsRouter.get(
  "/department",
  authenticate,
  authorize("departments:read"),
  AnalyticsController.getDepartmentDashboard,
);

analyticsRouter.get(
  "/admin",
  authenticate,
  authorize("users:manage"),
  AnalyticsController.getAdminDashboard,
);

analyticsRouter.get(
  "/charts",
  authenticate,
  AnalyticsController.getCharts,
);

