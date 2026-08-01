import { useQuery, useMutation } from "@tanstack/react-query";
import { sdkRequest } from "../../../lib/api-sdk.js";
import { toast } from "sonner";
import { apiClient } from "../../../lib/api-client.js";

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

export interface ReportDefinition {
  type: ReportType;
  name: string;
  description: string;
  metrics: string[];
  supportedFormats: ExportFormat[];
}

export interface ReportHistoryEntry {
  id: string;
  type: ReportType;
  generatedAt: string;
  generatedBy: string;
  exportFormat: ExportFormat | null;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const reportKeys = {
  all: ["reports"] as const,
  available: () => [...reportKeys.all, "available"] as const,
  history: () => [...reportKeys.all, "history"] as const,
  report: (type: ReportType, filters: ReportFilters) =>
    [...reportKeys.all, type, filters] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAvailableReports() {
  return useQuery({
    queryKey: reportKeys.available(),
    queryFn: () =>
      sdkRequest<ReportDefinition[]>({
        method: "GET",
        url: "/reports",
      }),
    staleTime: 10 * 60 * 1000, // 10 minutes — report catalog rarely changes
  });
}

export function useGenerateReport(
  type: ReportType | null,
  filters: ReportFilters,
  enabled = false
) {
  return useQuery({
    queryKey: reportKeys.report(type as ReportType, filters),
    queryFn: () =>
      sdkRequest<Record<string, unknown>>({
        method: "GET",
        url: `/reports/${type}`,
        params: filters,
      }),
    enabled: enabled && !!type,
    staleTime: 2 * 60 * 1000,
  });
}

export function useReportHistory() {
  return useQuery({
    queryKey: reportKeys.history(),
    queryFn: () =>
      sdkRequest<ReportHistoryEntry[]>({
        method: "GET",
        url: "/reports/history",
      }),
  });
}

export function useExportReport() {
  return useMutation({
    mutationFn: async (variables: {
      type: ReportType;
      format: ExportFormat;
      filters?: ReportFilters;
    }) => {
      const response = await apiClient.request<Blob>({
        method: "POST",
        url: "/reports/export",
        data: variables,
        responseType: "blob",
      });

      // Extract filename from Content-Disposition header
      const disposition = response.headers["content-disposition"] as string | undefined;
      const filenameMatch = disposition?.match(/filename="(.+?)"/);
      const filename =
        filenameMatch?.[1] ??
        `report_${variables.type.toLowerCase()}.${variables.format === "PDF" ? "pdf" : variables.format === "EXCEL" ? "xlsx" : "csv"}`;

      // Trigger browser download
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { filename };
    },
    onSuccess: ({ filename }) => {
      toast.success(`Report downloaded: ${filename}`);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to export report");
    },
  });
}
