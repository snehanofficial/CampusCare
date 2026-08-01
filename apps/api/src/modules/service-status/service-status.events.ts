import { eventBus } from "../../utils/event-bus.js";
import { ServiceStatusService } from "./service-status.service.js";
import { logger } from "../../utils/logger.js";

export function initServiceStatusListeners(): void {
  logger.info("Initializing event-driven Service Status listeners...");

  // 1. Incident Created -> Service status becomes DOWN
  eventBus.subscribe("incident.created", async (data: any) => {
    try {
      const { incidentId, serviceId, title } = data;
      if (serviceId) {
        await ServiceStatusService.handleIncidentCreated(incidentId, serviceId, title || "Active Incident");
      } else {
        logger.warn(data, "[ServiceStatusListener] incident.created event missing serviceId");
      }
    } catch (err) {
      logger.error(err, "Error handling event incident.created in service status system");
    }
  });

  // 2. Incident Resolved -> Service status becomes OPERATIONAL
  eventBus.subscribe("incident.resolved", async (data: any) => {
    try {
      const { incidentId, serviceId } = data;
      if (serviceId) {
        await ServiceStatusService.handleIncidentResolved(incidentId, serviceId);
      } else {
        logger.warn(data, "[ServiceStatusListener] incident.resolved event missing serviceId");
      }
    } catch (err) {
      logger.error(err, "Error handling event incident.resolved in service status system");
    }
  });

  // 3. Maintenance Started -> Service status becomes MAINTENANCE
  eventBus.subscribe("maintenance.started", async (data: any) => {
    try {
      const { windowId, serviceId, title } = data;
      if (serviceId && windowId) {
        await ServiceStatusService.handleMaintenanceStarted(windowId, serviceId, title || "Scheduled Maintenance");
      } else {
        logger.warn(data, "[ServiceStatusListener] maintenance.started event missing serviceId or windowId");
      }
    } catch (err) {
      logger.error(err, "Error handling event maintenance.started in service status system");
    }
  });

  // 4. Maintenance Completed -> Service status becomes OPERATIONAL
  eventBus.subscribe("maintenance.completed", async (data: any) => {
    try {
      const { windowId, serviceId, title } = data;
      if (serviceId && windowId) {
        await ServiceStatusService.handleMaintenanceCompleted(windowId, serviceId, title || "Scheduled Maintenance");
      } else {
        logger.warn(data, "[ServiceStatusListener] maintenance.completed event missing serviceId or windowId");
      }
    } catch (err) {
      logger.error(err, "Error handling event maintenance.completed in service status system");
    }
  });
}
