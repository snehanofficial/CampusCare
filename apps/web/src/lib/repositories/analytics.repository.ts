import { isMockEnabled, simulateDelay } from "../../mocks/index.js";
import { apiClient } from "../api-client.js";
import { mockTicketVolumeData, mockCategoryData, mockMttrData } from "../../mocks/analytics.js";

export interface StudentDashboard {
  totalTickets: number;
  resolvedTicketsWaitingVerification: number;
  activeTickets: number;
  closedTickets: number;
  recentTickets: Array<{
    id: string;
    ticketNumber: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
}

export interface TechnicianDashboard {
  assignedTickets: number;
  urgentTickets: number;
  reopenedTickets: number;
  slaBreachedTickets: number;
  recentAssignments: Array<{
    id: string;
    ticketNumber: string;
    title: string;
    status: string;
    priority: string;
    updatedAt: string;
  }>;
}

export interface DepartmentDashboard {
  totalTickets: number;
  activeTicketsCount: number;
  resolvedTicketsCount: number;
  slaComplianceRate: number;
  avgResolutionHours: number;
  priorityDistribution: Record<string, number>;
}

export interface AdminDashboard {
  activeTicketsCount: number;
  resolvedTicketsCount: number;
  closedTicketsCount: number;
  globalSlaComplianceRate: number;
  incidentCount: number;
  outagesCount: number;
  departmentWorkload: Array<{
    name: string;
    activeCount: number;
  }>;
}

export interface ChartsData {
  ticketVolume: Array<{ name: string; opened: number; resolved: number }>;
  mttrTrend: Array<{ name: string; hours: number }>;
  categoryDistribution: Array<{ name: string; value: number; color?: string }>;
}

export interface IAnalyticsRepository {
  getStudentDashboard(): Promise<StudentDashboard>;
  getTechnicianDashboard(): Promise<TechnicianDashboard>;
  getDepartmentDashboard(): Promise<DepartmentDashboard>;
  getAdminDashboard(): Promise<AdminDashboard>;
  getCharts(): Promise<ChartsData>;
}

// ─── Mock ─────────────────────────────────────────────────────────────────────
class MockAnalyticsRepository implements IAnalyticsRepository {
  async getStudentDashboard(): Promise<StudentDashboard> {
    return simulateDelay({
      totalTickets: 12,
      resolvedTicketsWaitingVerification: 2,
      activeTickets: 4,
      closedTickets: 6,
      recentTickets: [
        { id: "1", ticketNumber: "TIC-101", title: "Library Wi-Fi down", status: "RESOLVED", priority: "HIGH", createdAt: new Date().toISOString() },
        { id: "2", ticketNumber: "TIC-102", title: "Projector broken", status: "OPEN", priority: "MEDIUM", createdAt: new Date().toISOString() },
      ],
    });
  }

  async getTechnicianDashboard(): Promise<TechnicianDashboard> {
    return simulateDelay({
      assignedTickets: 6,
      urgentTickets: 2,
      reopenedTickets: 1,
      slaBreachedTickets: 0,
      recentAssignments: [
        { id: "1", ticketNumber: "TIC-101", title: "Library Wi-Fi down", status: "RESOLVED", priority: "HIGH", updatedAt: new Date().toISOString() },
      ],
    });
  }

  async getDepartmentDashboard(): Promise<DepartmentDashboard> {
    return simulateDelay({
      totalTickets: 48,
      activeTicketsCount: 15,
      resolvedTicketsCount: 8,
      slaComplianceRate: 92.5,
      avgResolutionHours: 3.4,
      priorityDistribution: { LOW: 10, MEDIUM: 20, HIGH: 12, CRITICAL: 6 },
    });
  }

  async getAdminDashboard(): Promise<AdminDashboard> {
    return simulateDelay({
      activeTicketsCount: 32,
      resolvedTicketsCount: 14,
      closedTicketsCount: 124,
      globalSlaComplianceRate: 94.6,
      incidentCount: 2,
      outagesCount: 1,
      departmentWorkload: [
        { name: "IT Infrastructure", activeCount: 12 },
        { name: "Academic Services", activeCount: 8 },
        { name: "Facilities Department", activeCount: 12 },
      ],
    });
  }

  async getCharts(): Promise<ChartsData> {
    return simulateDelay({
      ticketVolume: mockTicketVolumeData,
      mttrTrend: mockMttrData,
      categoryDistribution: mockCategoryData,
    });
  }
}

// ─── HTTP ────────────────────────────────────────────────────────────────────
class HttpAnalyticsRepository implements IAnalyticsRepository {
  async getStudentDashboard(): Promise<StudentDashboard> {
    const { data } = await apiClient.get<{ success: boolean; data: StudentDashboard }>("/analytics/student");
    return data.data;
  }

  async getTechnicianDashboard(): Promise<TechnicianDashboard> {
    const { data } = await apiClient.get<{ success: boolean; data: TechnicianDashboard }>("/analytics/technician");
    return data.data;
  }

  async getDepartmentDashboard(): Promise<DepartmentDashboard> {
    const { data } = await apiClient.get<{ success: boolean; data: DepartmentDashboard }>("/analytics/department");
    return data.data;
  }

  async getAdminDashboard(): Promise<AdminDashboard> {
    const { data } = await apiClient.get<{ success: boolean; data: AdminDashboard }>("/analytics/admin");
    return data.data;
  }

  async getCharts(): Promise<ChartsData> {
    const { data } = await apiClient.get<{ success: boolean; data: ChartsData }>("/analytics/charts");
    return data.data;
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────
export const analyticsRepository: IAnalyticsRepository = new Proxy({} as IAnalyticsRepository, {
  get: (_target, prop) => {
    const activeRepo = isMockEnabled() ? new MockAnalyticsRepository() : new HttpAnalyticsRepository();
    return Reflect.get(activeRepo, prop);
  },
});
