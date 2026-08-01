import { logger } from "../../utils/logger.js";
import { SocketService } from "../../sockets/socket.service.js";
import { ServiceStatus, ServiceAvailabilityStats } from "./service-status.types.js";
import {
  findServices,
  findServiceById,
  findServiceByName,
  updateServiceStatus,
  createStatusHistory,
  createMaintenanceWindow,
  findMaintenanceWindowsByService,
  findStatusHistories,
  findLatestHistoryBefore,
  updateIncidentRelation,
  resolveIncidentRelation,
} from "./service-status.repository.js";

export class ServiceStatusService {
  /**
   * Get all services.
   */
  static async getServices() {
    logger.debug("Executing ServiceStatusService.getServices");
    return findServices();
  }

  /**
   * Get service by ID.
   */
  static async getServiceById(id: string) {
    logger.debug({ id }, "Executing ServiceStatusService.getServiceById");
    const service = await findServiceById(id);
    if (!service) {
      return null;
    }
    const histories = await findStatusHistories(
      id,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // last 30 days
      new Date()
    );
    const maintenanceWindows = await findMaintenanceWindowsByService(id);
    return {
      ...service,
      histories,
      maintenanceWindows,
    };
  }

  /**
   * Update service status manually.
   */
  static async updateStatus(
    id: string,
    status: ServiceStatus,
    reason?: string,
    changedBy?: string
  ) {
    logger.info({ id, status, reason, changedBy }, "Executing ServiceStatusService.updateStatus");
    const service = await findServiceById(id);
    if (!service) {
      throw new Error("Service not found");
    }

    if (service.status === status) {
      throw new Error(`Service is already in ${status} status`);
    }

    const previousStatus = service.status as ServiceStatus;

    // Update service
    const updated = await updateServiceStatus(id, status);

    // Create history entry
    await createStatusHistory({
      serviceId: id,
      previousStatus,
      newStatus: status,
      reason,
      changedBy,
    });

    // Real-time broadcast
    SocketService.broadcast("service.status.updated", {
      serviceId: id,
      name: service.name,
      previousStatus,
      newStatus: status,
      reason,
      changedAt: updated.updatedAt,
    });

    return updated;
  }

  /**
   * Schedule a maintenance window.
   */
  static async createMaintenanceWindow(
    serviceId: string,
    data: {
      title: string;
      description?: string;
      startTime: Date;
      endTime: Date;
    }
  ) {
    logger.info({ serviceId, data }, "Executing ServiceStatusService.createMaintenanceWindow");
    const service = await findServiceById(serviceId);
    if (!service) {
      throw new Error("Service not found");
    }

    const now = new Date();
    let status: "SCHEDULED" | "ACTIVE" | "COMPLETED" = "SCHEDULED";
    if (now >= data.startTime && now <= data.endTime) {
      status = "ACTIVE";
    } else if (now > data.endTime) {
      status = "COMPLETED";
    }

    const window = await createMaintenanceWindow({
      serviceId,
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      status,
    });

    // If active immediately, update service status to MAINTENANCE
    if (status === "ACTIVE") {
      await this.updateStatus(
        serviceId,
        "MAINTENANCE",
        `Scheduled Maintenance started: ${data.title}`,
        "SYSTEM"
      );
    }

    // Real-time broadcast
    SocketService.broadcast("maintenance.updated", {
      action: "create",
      windowId: window.id,
      serviceId,
      status,
      title: data.title,
    });

    return window;
  }

  /**
   * Get status history timeline.
   */
  static async getHistory(serviceId: string) {
    logger.debug({ serviceId }, "Executing ServiceStatusService.getHistory");
    const service = await findServiceById(serviceId);
    if (!service) {
      throw new Error("Service not found");
    }
    return findStatusHistories(
      serviceId,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // past 30 days
      new Date()
    );
  }

  /**
   * Calculate availability statistics.
   */
  static async calculateAvailability(): Promise<ServiceAvailabilityStats[]> {
    logger.debug("Executing ServiceStatusService.calculateAvailability");
    const services = await findServices();
    const now = new Date();

    const stats: ServiceAvailabilityStats[] = [];

    for (const service of services) {
      const u24h = await this.calculateUptimeForRange(
        service.id,
        new Date(now.getTime() - 24 * 60 * 60 * 1000),
        now
      );
      const u7d = await this.calculateUptimeForRange(
        service.id,
        new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        now
      );
      const u30d = await this.calculateUptimeForRange(
        service.id,
        new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        now
      );

      // Last 30 days daily points
      const dailyHistory: { date: string; uptime: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0);
        const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59);
        const label = dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const dayUptime = await this.calculateUptimeForRange(service.id, dayStart, dayEnd);
        dailyHistory.push({ date: label, uptime: dayUptime });
      }

      // Last 24 hours points
      const hourlyHistory: { date: string; uptime: number }[] = [];
      for (let i = 23; i >= 0; i--) {
        const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
        hourStart.setMinutes(0, 0, 0);
        const hourEnd = new Date(hourStart.getTime() + 59 * 60 * 1000 + 59 * 1000);
        const label = hourStart.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        const hourUptime = await this.calculateUptimeForRange(service.id, hourStart, hourEnd);
        hourlyHistory.push({ date: label, uptime: hourUptime });
      }

      stats.push({
        serviceId: service.id,
        serviceName: service.name,
        uptime24h: u24h,
        uptime7d: u7d,
        uptime30d: u30d,
        dailyHistory,
        hourlyHistory,
      });
    }

    return stats;
  }

  /**
   * Helper algorithm to calculate uptime percentage.
   */
  private static async calculateUptimeForRange(
    serviceId: string,
    start: Date,
    end: Date
  ): Promise<number> {
    const histories = await findStatusHistories(serviceId, start, end);
    const latestBefore = await findLatestHistoryBefore(serviceId, start);

    let currentState: ServiceStatus = (latestBefore?.newStatus as ServiceStatus) || "OPERATIONAL";
    let lastChangeTime = start.getTime();
    let downtimeMs = 0;

    for (const log of histories) {
      const logTime = log.createdAt.getTime();
      if (currentState === "DOWN") {
        downtimeMs += logTime - lastChangeTime;
      }
      currentState = log.newStatus as ServiceStatus;
      lastChangeTime = logTime;
    }

    const endTime = end.getTime();
    if (currentState === "DOWN") {
      downtimeMs += endTime - lastChangeTime;
    }

    const totalTimeMs = endTime - start.getTime();
    if (totalTimeMs <= 0) return 100;

    const uptime = ((totalTimeMs - downtimeMs) / totalTimeMs) * 100;
    return parseFloat(Math.max(0, Math.min(100, uptime)).toFixed(2));
  }

  // --- Domain Event Handler Methods ---

  static async handleIncidentCreated(incidentId: string, serviceId: string, title: string) {
    logger.info({ incidentId, serviceId, title }, "ServiceStatusService handling incident.created");
    try {
      await updateIncidentRelation(incidentId, serviceId, "INVESTIGATING");
      await this.updateStatus(
        serviceId,
        "DOWN",
        `Service degraded due to incident: ${title}`,
        "SYSTEM"
      );
    } catch (err) {
      logger.error(err, `Error processing incident.created for service ${serviceId}`);
    }
  }

  static async handleIncidentResolved(incidentId: string, serviceId: string) {
    logger.info({ incidentId, serviceId }, "ServiceStatusService handling incident.resolved");
    try {
      await resolveIncidentRelation(incidentId);
      await this.updateStatus(
        serviceId,
        "OPERATIONAL",
        "Service restored following incident resolution",
        "SYSTEM"
      );
    } catch (err) {
      logger.error(err, `Error processing incident.resolved for service ${serviceId}`);
    }
  }

  static async handleMaintenanceStarted(windowId: string, serviceId: string, title: string) {
    logger.info({ windowId, serviceId, title }, "ServiceStatusService handling maintenance.started");
    try {
      await this.updateStatus(
        serviceId,
        "MAINTENANCE",
        `Maintenance window started: ${title}`,
        "SYSTEM"
      );
    } catch (err) {
      logger.error(err, `Error processing maintenance.started for service ${serviceId}`);
    }
  }

  static async handleMaintenanceCompleted(windowId: string, serviceId: string, title: string) {
    logger.info({ windowId, serviceId, title }, "ServiceStatusService handling maintenance.completed");
    try {
      await this.updateStatus(
        serviceId,
        "OPERATIONAL",
        `Maintenance window completed: ${title}`,
        "SYSTEM"
      );
    } catch (err) {
      logger.error(err, `Error processing maintenance.completed for service ${serviceId}`);
    }
  }
}
export default ServiceStatusService;
