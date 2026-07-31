export interface MockReport {
  id: string;
  name: string;
  description: string;
  type: "TICKET_VOLUME" | "ASSET_WARRANTY" | "INVENTORY_LEVELS" | "SLA_BREACHES";
  status: "READY" | "PENDING" | "FAILED";
  generatedBy: string;
  createdAt: string;
  downloadUrl?: string;
}

export const mockReports: MockReport[] = [
  {
    id: "r-1",
    name: "Q2 Ticket Resolution Efficiency Report",
    description: "Detailed analysis of response times, mean time to resolution (MTTR), and agent performance metrics.",
    type: "TICKET_VOLUME",
    status: "READY",
    generatedBy: "Alex Admin",
    createdAt: "2026-07-28T14:00:00Z",
    downloadUrl: "/downloads/r-1.pdf",
  },
  {
    id: "r-2",
    name: "Under-Warranty Assets Registry",
    description: "Export of all hardware devices currently covered under vendor service agreements, matching department allocations.",
    type: "ASSET_WARRANTY",
    status: "READY",
    generatedBy: "Sarah Tech",
    createdAt: "2026-07-30T10:15:00Z",
    downloadUrl: "/downloads/r-2.xlsx",
  },
  {
    id: "r-3",
    name: "Critical Stock Reorder Report",
    description: "Trigger alert list displaying all storage items currently falling below minimal stocking thresholds.",
    type: "INVENTORY_LEVELS",
    status: "READY",
    generatedBy: "System Cron",
    createdAt: "2026-07-31T00:00:00Z",
    downloadUrl: "/downloads/r-3.pdf",
  },
  {
    id: "r-4",
    name: "Monthly SLA Compliance Audit",
    description: "Aggregate compliance score breakdowns and breach justifications lists for the month of July 2026.",
    type: "SLA_BREACHES",
    status: "PENDING",
    generatedBy: "Alex Admin",
    createdAt: "2026-07-31T23:55:00Z",
  }
];
