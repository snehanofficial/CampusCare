import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";
import { randomUUID } from "crypto";
import type {
  ReportType,
  ReportFilters,
  ReportDefinition,
  GeneratedReport,
  ReportHistoryEntry,
  TicketReportData,
  AssetReportData,
  InventoryReportData,
  MaintenanceReportData,
  SlaReportData,
  IncidentReportData,
  ExportFormat,
} from "./reports.types.js";
import { exportToCsv, flattenForCsv } from "./exporters/csv.exporter.js";
import { exportToExcel } from "./exporters/excel.exporter.js";
import { exportToPdf } from "./exporters/pdf.exporter.js";

// ─── Report Registry ──────────────────────────────────────────────────────────

export const REPORT_REGISTRY: ReportDefinition[] = [
  {
    type: "TICKET_REPORT",
    name: "Ticket Report",
    description: "Overview of all support tickets including priority, status, category, and resolution metrics.",
    metrics: ["Total tickets", "Open / Closed breakdown", "Priority distribution", "Category distribution", "Department-wise", "Avg resolution time"],
    supportedFormats: ["PDF", "EXCEL", "CSV"],
  },
  {
    type: "ASSET_REPORT",
    name: "Asset Report",
    description: "Summary of campus assets by status, category, and department assignment.",
    metrics: ["Total assets", "Asset categories", "Assigned vs available", "Retired assets", "Asset health summary"],
    supportedFormats: ["PDF", "EXCEL", "CSV"],
  },
  {
    type: "INVENTORY_REPORT",
    name: "Inventory Report",
    description: "Stock levels, low stock alerts, and transaction history for spare parts and inventory.",
    metrics: ["Stock quantity", "Low stock items", "Stock additions", "Stock deductions", "Recent transactions"],
    supportedFormats: ["PDF", "EXCEL", "CSV"],
  },
  {
    type: "MAINTENANCE_REPORT",
    name: "Maintenance Report",
    description: "Scheduled, completed, and overdue maintenance work orders with monthly trends.",
    metrics: ["Completed maintenance", "Pending maintenance", "Overdue maintenance", "Monthly breakdown"],
    supportedFormats: ["PDF", "EXCEL", "CSV"],
  },
  {
    type: "SLA_REPORT",
    name: "SLA Report",
    description: "Service Level Agreement compliance analysis with response and resolution time metrics.",
    metrics: ["SLA compliance %", "Breached tickets", "Avg response time", "Avg resolution time", "Priority breakdown"],
    supportedFormats: ["PDF", "EXCEL", "CSV"],
  },
  {
    type: "INCIDENT_REPORT",
    name: "Incident Report",
    description: "Active and resolved incidents with severity distribution and impact analysis.",
    metrics: ["Active incidents", "Resolved incidents", "Severity distribution", "Avg resolution time", "Impacted tickets"],
    supportedFormats: ["PDF", "EXCEL", "CSV"],
  },
];

// ─── In-memory Report History ─────────────────────────────────────────────────
const reportHistory: ReportHistoryEntry[] = [];

function buildDateFilter(filters?: ReportFilters) {
  const startDate = filters?.startDate ? new Date(filters.startDate) : undefined;
  const endDate = filters?.endDate ? new Date(filters.endDate) : undefined;
  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
  }
  return { startDate, endDate };
}

// ─── Report Generators ────────────────────────────────────────────────────────

async function generateTicketReport(filters?: ReportFilters): Promise<TicketReportData> {
  const { startDate, endDate } = buildDateFilter(filters);

  const where: Record<string, unknown> = {};
  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }
  if (filters?.departmentId) where.departmentId = filters.departmentId;
  if (filters?.categoryId) where.categoryId = filters.categoryId;
  if (filters?.status) where.status = filters.status;
  if (filters?.priority) where.priority = filters.priority;
  if (filters?.assigneeId) where.assigneeId = filters.assigneeId;

  const tickets = await prisma.ticket.findMany({
    where,
    select: {
      status: true,
      priority: true,
      category: { select: { name: true } },
      department: { select: { name: true } },
      createdAt: true,
      resolvedAt: true,
    },
  });

  const priorityDist: Record<string, number> = {};
  const categoryDist: Record<string, number> = {};
  const deptDist: Record<string, number> = {};
  let open = 0, inProgress = 0, resolved = 0, closed = 0;
  let totalResolutionMs = 0, resolvedCount = 0;

  for (const t of tickets) {
    // Status counts
    if (t.status === "OPEN" || t.status === "PENDING") open++;
    else if (t.status === "IN_PROGRESS" || t.status === "ASSIGNED") inProgress++;
    else if (t.status === "RESOLVED") resolved++;
    else if (t.status === "CLOSED") closed++;

    // Distributions
    priorityDist[t.priority] = (priorityDist[t.priority] ?? 0) + 1;
    categoryDist[t.category.name] = (categoryDist[t.category.name] ?? 0) + 1;
    deptDist[t.department.name] = (deptDist[t.department.name] ?? 0) + 1;

    // Resolution time
    if (t.resolvedAt) {
      totalResolutionMs += t.resolvedAt.getTime() - t.createdAt.getTime();
      resolvedCount++;
    }
  }

  const avgResolutionTimeHours = resolvedCount > 0
    ? parseFloat((totalResolutionMs / resolvedCount / 3_600_000).toFixed(2))
    : null;

  return {
    total: tickets.length,
    open,
    inProgress,
    resolved,
    closed,
    priorityDistribution: priorityDist,
    categoryDistribution: categoryDist,
    departmentDistribution: deptDist,
    avgResolutionTimeHours,
    period: {
      start: startDate?.toISOString() ?? "All time",
      end: endDate?.toISOString() ?? new Date().toISOString(),
    },
  };
}

async function generateAssetReport(filters?: ReportFilters): Promise<AssetReportData> {
  const { startDate, endDate } = buildDateFilter(filters);

  const where: Record<string, unknown> = {};
  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }
  if (filters?.departmentId) where.departmentId = filters.departmentId;
  if (filters?.status) where.status = filters.status;

  const assets = await prisma.asset.findMany({
    where,
    select: {
      status: true,
      model: true,
      manufacturer: true,
      department: { select: { name: true } },
    },
  });

  const categoryDist: Record<string, number> = {};
  const deptDist: Record<string, number> = {};
  let operational = 0, inMaintenance = 0, broken = 0, retired = 0, lost = 0;

  for (const a of assets) {
    if (a.status === "OPERATIONAL") operational++;
    else if (a.status === "MAINTENANCE") inMaintenance++;
    else if (a.status === "BROKEN") broken++;
    else if (a.status === "RETIRED") retired++;
    else if (a.status === "LOST") lost++;

    // Group by model as category proxy
    const cat = a.model || "Unknown";
    categoryDist[cat] = (categoryDist[cat] ?? 0) + 1;
    deptDist[a.department.name] = (deptDist[a.department.name] ?? 0) + 1;
  }

  return {
    total: assets.length,
    operational,
    inMaintenance,
    broken,
    retired,
    lost,
    assigned: operational,
    available: operational,
    categoryDistribution: categoryDist,
    departmentDistribution: deptDist,
    period: {
      start: startDate?.toISOString() ?? "All time",
      end: endDate?.toISOString() ?? new Date().toISOString(),
    },
  };
}

async function generateInventoryReport(filters?: ReportFilters): Promise<InventoryReportData> {
  const { startDate, endDate } = buildDateFilter(filters);

  const items = await prisma.inventoryItem.findMany({
    include: {
      transactions: {
        where: {
          ...(startDate || endDate
            ? { createdAt: { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) } }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { item: { select: { name: true } } },
      },
    },
  });

  const lowStockItems = items
    .filter((i) => i.quantity <= i.minQuantity)
    .map((i) => ({ id: i.id, name: i.name, sku: i.sku, quantity: i.quantity, minQuantity: i.minQuantity }));

  let stockAdditions = 0;
  let stockDeductions = 0;
  const recentTransactions: InventoryReportData["recentTransactions"] = [];

  for (const item of items) {
    for (const tx of item.transactions) {
      if (tx.transactionType === "ADD") stockAdditions += tx.quantity;
      else stockDeductions += tx.quantity;

      if (recentTransactions.length < 20) {
        recentTransactions.push({
          itemName: item.name,
          type: tx.transactionType,
          quantity: tx.quantity,
          date: tx.createdAt.toISOString(),
        });
      }
    }
  }

  return {
    totalItems: items.length,
    totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
    lowStockItems,
    recentTransactions,
    stockAdditions,
    stockDeductions,
    period: {
      start: startDate?.toISOString() ?? "All time",
      end: endDate?.toISOString() ?? new Date().toISOString(),
    },
  };
}

async function generateMaintenanceReport(filters?: ReportFilters): Promise<MaintenanceReportData> {
  const { startDate, endDate } = buildDateFilter(filters);
  const now = new Date();

  const where: Record<string, unknown> = {};
  if (startDate || endDate) {
    where.startTime = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }

  const windows = await prisma.maintenanceWindow.findMany({ where });

  let completed = 0, pending = 0, overdue = 0;
  const byMonth: Record<string, number> = {};

  for (const w of windows) {
    if (w.status === "COMPLETED") completed++;
    else if (w.endTime < now) overdue++;
    else pending++;

    const month = w.startTime.toLocaleString("en-US", { year: "numeric", month: "short" });
    byMonth[month] = (byMonth[month] ?? 0) + 1;
  }

  return {
    totalScheduled: windows.length,
    completed,
    pending,
    overdue,
    maintenanceByMonth: byMonth,
    period: {
      start: startDate?.toISOString() ?? "All time",
      end: endDate?.toISOString() ?? new Date().toISOString(),
    },
  };
}

async function generateSlaReport(filters?: ReportFilters): Promise<SlaReportData> {
  const { startDate, endDate } = buildDateFilter(filters);

  const where: Record<string, unknown> = {
    dueAt: { not: null },
  };
  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }
  if (filters?.departmentId) where.departmentId = filters.departmentId;
  if (filters?.priority) where.priority = filters.priority;

  const tickets = await prisma.ticket.findMany({
    where,
    select: {
      status: true,
      priority: true,
      dueAt: true,
      createdAt: true,
      resolvedAt: true,
    },
  });

  const now = new Date();
  let withinSla = 0, breached = 0;
  const breachedByPriority: Record<string, number> = {};
  let totalResponseMs = 0, totalResolutionMs = 0, resolvedCount = 0;

  for (const t of tickets) {
    if (!t.dueAt) continue;
    const resolutionTime = t.resolvedAt ?? now;

    if (resolutionTime <= t.dueAt) withinSla++;
    else {
      breached++;
      breachedByPriority[t.priority] = (breachedByPriority[t.priority] ?? 0) + 1;
    }

    if (t.resolvedAt) {
      totalResolutionMs += t.resolvedAt.getTime() - t.createdAt.getTime();
      resolvedCount++;
    }
  }

  const total = tickets.length;

  return {
    totalTickets: total,
    withinSla,
    breached,
    compliancePercent: total > 0 ? parseFloat(((withinSla / total) * 100).toFixed(2)) : 100,
    avgResponseTimeHours: null, // Would need first-response tracking
    avgResolutionTimeHours: resolvedCount > 0
      ? parseFloat((totalResolutionMs / resolvedCount / 3_600_000).toFixed(2))
      : null,
    breachedByPriority,
    period: {
      start: startDate?.toISOString() ?? "All time",
      end: endDate?.toISOString() ?? new Date().toISOString(),
    },
  };
}

async function generateIncidentReport(filters?: ReportFilters): Promise<IncidentReportData> {
  const { startDate, endDate } = buildDateFilter(filters);

  const where: Record<string, unknown> = {};
  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }

  const incidents = await prisma.incident.findMany({
    where,
    include: { tickets: true },
  });

  const bySeverity: Record<string, number> = {};
  let active = 0, resolved = 0;
  let totalResolutionMs = 0, resolvedCount = 0;
  let totalImpactedTickets = 0;

  for (const inc of incidents) {
    if (inc.resolvedAt) {
      resolved++;
      totalResolutionMs += inc.resolvedAt.getTime() - inc.createdAt.getTime();
      resolvedCount++;
    } else {
      active++;
    }

    bySeverity[inc.severity] = (bySeverity[inc.severity] ?? 0) + 1;
    totalImpactedTickets += inc.tickets.length;
  }

  return {
    total: incidents.length,
    active,
    resolved,
    bySeverity,
    avgResolutionTimeHours: resolvedCount > 0
      ? parseFloat((totalResolutionMs / resolvedCount / 3_600_000).toFixed(2))
      : null,
    impactedTicketsCount: totalImpactedTickets,
    period: {
      start: startDate?.toISOString() ?? "All time",
      end: endDate?.toISOString() ?? new Date().toISOString(),
    },
  };
}

// ─── Main Service ─────────────────────────────────────────────────────────────

export class ReportsService {
  static getAvailableReports(): ReportDefinition[] {
    logger.debug("Executing ReportsService.getAvailableReports");
    return REPORT_REGISTRY;
  }

  static async generateReport(type: ReportType, filters?: ReportFilters): Promise<GeneratedReport> {
    logger.info({ type, filters }, "Executing ReportsService.generateReport");

    let data;
    switch (type) {
      case "TICKET_REPORT":
        data = await generateTicketReport(filters);
        break;
      case "ASSET_REPORT":
        data = await generateAssetReport(filters);
        break;
      case "INVENTORY_REPORT":
        data = await generateInventoryReport(filters);
        break;
      case "MAINTENANCE_REPORT":
        data = await generateMaintenanceReport(filters);
        break;
      case "SLA_REPORT":
        data = await generateSlaReport(filters);
        break;
      case "INCIDENT_REPORT":
        data = await generateIncidentReport(filters);
        break;
      default:
        throw new Error(`Unknown report type: ${type}`);
    }

    return {
      type,
      generatedAt: new Date().toISOString(),
      filters: filters ?? {},
      data,
    };
  }

  static async exportReport(
    type: ReportType,
    format: ExportFormat,
    filters: ReportFilters | undefined,
    generatedBy: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    logger.info({ type, format }, "Executing ReportsService.exportReport");

    const report = await this.generateReport(type, filters);
    const def = REPORT_REGISTRY.find((r) => r.type === type)!;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const baseFilename = `${type.toLowerCase()}_${timestamp}`;

    // Track in history
    reportHistory.unshift({
      id: randomUUID(),
      type,
      generatedAt: new Date().toISOString(),
      generatedBy,
      exportFormat: format,
    });
    if (reportHistory.length > 100) reportHistory.pop();

    const data = report.data as unknown as Record<string, unknown>;

    if (format === "CSV") {
      const flat = flattenForCsv(data);
      const rows = Object.entries(flat).map(([k, v]) => ({ metric: k, value: String(v ?? "") }));
      const buffer = exportToCsv(rows, def.name);
      return {
        buffer,
        contentType: "text/csv",
        filename: `${baseFilename}.csv`,
      };
    }

    if (format === "EXCEL") {
      const flat = flattenForCsv(data);
      const rows = Object.entries(flat).map(([k, v]) => [k, String(v ?? "")]);
      const buffer = await exportToExcel([
        {
          name: def.name,
          headers: ["Metric", "Value"],
          rows,
        },
      ], def.name);
      return {
        buffer,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename: `${baseFilename}.xlsx`,
      };
    }

    // PDF
    const flat = flattenForCsv(data);
    const pdfRows = Object.entries(flat).map(([k, v]) => ({
      label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: String(v ?? ""),
    }));

    const buffer = await exportToPdf(
      def.name,
      def.description,
      [{ heading: "Report Summary", rows: pdfRows }],
      report.generatedAt
    );

    return {
      buffer,
      contentType: "application/pdf",
      filename: `${baseFilename}.pdf`,
    };
  }

  static getReportHistory(): ReportHistoryEntry[] {
    logger.debug("Executing ReportsService.getReportHistory");
    return reportHistory;
  }
}
