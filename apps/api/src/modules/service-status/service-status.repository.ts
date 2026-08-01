import { prisma } from "../../database/prisma.js";
import { ServiceStatus } from "./service-status.types.js";

export async function findServices() {
  return prisma.service.findMany({
    include: {
      incidents: {
        where: {
          resolvedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      maintenances: {
        where: {
          status: { in: ["SCHEDULED", "ACTIVE"] },
        },
        orderBy: {
          startTime: "asc",
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function findServiceById(id: string) {
  return prisma.service.findUnique({
    where: { id },
  });
}

export async function findServiceByName(name: string) {
  return prisma.service.findUnique({
    where: { name },
  });
}

export async function updateServiceStatus(id: string, status: ServiceStatus) {
  return prisma.service.update({
    where: { id },
    data: { status },
  });
}

export async function createStatusHistory(data: {
  serviceId: string;
  previousStatus: ServiceStatus;
  newStatus: ServiceStatus;
  reason?: string;
  changedBy?: string;
}) {
  return prisma.serviceStatusHistory.create({
    data: {
      serviceId: data.serviceId,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
      reason: data.reason || null,
      changedBy: data.changedBy || "SYSTEM",
    },
  });
}

export async function createMaintenanceWindow(data: {
  serviceId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED";
}) {
  return prisma.maintenanceWindow.create({
    data: {
      serviceId: data.serviceId,
      title: data.title,
      description: data.description || null,
      startTime: data.startTime,
      endTime: data.endTime,
      status: data.status,
    },
  });
}

export async function findMaintenanceWindowsByService(serviceId: string) {
  return prisma.maintenanceWindow.findMany({
    where: { serviceId },
    orderBy: { startTime: "asc" },
  });
}

export async function findAllMaintenanceWindows() {
  return prisma.maintenanceWindow.findMany({
    orderBy: { startTime: "asc" },
  });
}

export async function findStatusHistories(serviceId: string, start: Date, end: Date) {
  return prisma.serviceStatusHistory.findMany({
    where: {
      serviceId,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function findLatestHistoryBefore(serviceId: string, before: Date) {
  return prisma.serviceStatusHistory.findFirst({
    where: {
      serviceId,
      createdAt: {
        lt: before,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findActiveIncidents() {
  return prisma.incident.findMany({
    where: {
      resolvedAt: null,
      status: { not: "RESOLVED" },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateIncidentRelation(incidentId: string, serviceId: string, status?: string) {
  return prisma.incident.upsert({
    where: { id: incidentId },
    update: {
      serviceId,
      status: status || "INVESTIGATING",
    },
    create: {
      id: incidentId,
      title: "Active Incident",
      description: "Incident affecting campus service",
      serviceId,
      status: status || "INVESTIGATING",
    },
  });
}

export async function resolveIncidentRelation(incidentId: string) {
  return prisma.incident.update({
    where: { id: incidentId },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
  });
}
