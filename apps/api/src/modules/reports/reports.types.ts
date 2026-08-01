// ─── Report Types ─────────────────────────────────────────────────────────────

export type ReportType =
  | "TICKET_REPORT"
  | "ASSET_REPORT"
  | "INVENTORY_REPORT"
  | "MAINTENANCE_REPORT"
  | "SLA_REPORT"
  | "INCIDENT_REPORT";

export type ExportFormat = "PDF" | "EXCEL" | "CSV";

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  categoryId?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  buildingId?: string;
}

export interface ReportDefinition {
  type: ReportType;
  name: string;
  description: string;
  metrics: string[];
  supportedFormats: ExportFormat[];
}

// ─── Report Payloads ──────────────────────────────────────────────────────────

export interface TicketReportData {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  priorityDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  departmentDistribution: Record<string, number>;
  avgResolutionTimeHours: number | null;
  period: { start: string; end: string };
}

export interface AssetReportData {
  total: number;
  operational: number;
  inMaintenance: number;
  broken: number;
  retired: number;
  lost: number;
  assigned: number;
  available: number;
  categoryDistribution: Record<string, number>;
  departmentDistribution: Record<string, number>;
  period: { start: string; end: string };
}

export interface InventoryReportData {
  totalItems: number;
  totalQuantity: number;
  lowStockItems: { id: string; name: string; sku: string; quantity: number; minQuantity: number }[];
  recentTransactions: { itemName: string; type: string; quantity: number; date: string }[];
  stockAdditions: number;
  stockDeductions: number;
  period: { start: string; end: string };
}

export interface MaintenanceReportData {
  totalScheduled: number;
  completed: number;
  pending: number;
  overdue: number;
  maintenanceByMonth: Record<string, number>;
  period: { start: string; end: string };
}

export interface SlaReportData {
  totalTickets: number;
  withinSla: number;
  breached: number;
  compliancePercent: number;
  avgResponseTimeHours: number | null;
  avgResolutionTimeHours: number | null;
  breachedByPriority: Record<string, number>;
  period: { start: string; end: string };
}

export interface IncidentReportData {
  total: number;
  active: number;
  resolved: number;
  bySeverity: Record<string, number>;
  avgResolutionTimeHours: number | null;
  impactedTicketsCount: number;
  period: { start: string; end: string };
}

export type ReportData =
  | TicketReportData
  | AssetReportData
  | InventoryReportData
  | MaintenanceReportData
  | SlaReportData
  | IncidentReportData;

export interface GeneratedReport {
  type: ReportType;
  generatedAt: string;
  filters: ReportFilters;
  data: ReportData;
}

export interface ReportHistoryEntry {
  id: string;
  type: ReportType;
  generatedAt: string;
  generatedBy: string;
  exportFormat: ExportFormat | null;
}
