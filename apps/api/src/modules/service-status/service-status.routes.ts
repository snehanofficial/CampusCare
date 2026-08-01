import { Router } from "express";
import { ServiceStatusController } from "./service-status.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { serviceStatusUpdateSchema, maintenanceCreateSchema } from "./service-status.validator.js";

export const serviceStatusRouter = Router();

/**
 * @swagger
 * /api/v1/service-status:
 *   get:
 *     summary: Retrieve all campus digital services
 *     tags: [Service Status]
 */
serviceStatusRouter.get("/", authenticate, ServiceStatusController.getServices);

/**
 * @swagger
 * /api/v1/service-status/availability:
 *   get:
 *     summary: Get availability/uptime statistics for services
 *     tags: [Service Status]
 */
serviceStatusRouter.get("/availability", authenticate, ServiceStatusController.calculateAvailability);

/**
 * @swagger
 * /api/v1/service-status/{id}:
 *   get:
 *     summary: Retrieve a single service health details
 *     tags: [Service Status]
 */
serviceStatusRouter.get("/:id", authenticate, ServiceStatusController.getServiceById);

/**
 * @swagger
 * /api/v1/service-status/{id}/history:
 *   get:
 *     summary: Get status history timeline for a service
 *     tags: [Service Status]
 */
serviceStatusRouter.get("/:id/history", authenticate, ServiceStatusController.getHistory);

/**
 * @swagger
 * /api/v1/service-status/{id}:
 *   patch:
 *     summary: Update service status manually
 *     tags: [Service Status]
 */
serviceStatusRouter.patch(
  "/:id",
  authenticate,
  authorize("service_status.manage"),
  validate(serviceStatusUpdateSchema),
  ServiceStatusController.updateStatus
);

/**
 * @swagger
 * /api/v1/service-status/{id}/maintenance:
 *   post:
 *     summary: Schedule a maintenance window for a service
 *     tags: [Service Status]
 */
serviceStatusRouter.post(
  "/:id/maintenance",
  authenticate,
  authorize("service_status.manage"),
  validate(maintenanceCreateSchema),
  ServiceStatusController.createMaintenanceWindow
);

export default serviceStatusRouter;
