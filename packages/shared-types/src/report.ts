export interface AnalyticsSummary {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  criticalTickets: number;
  averageResolutionTimeMs: number;
  slaComplianceRate: number;
}

export interface HeatmapItem {
  location: string;
  ticketCount: number;
  latitude?: number;
  longitude?: number;
}
