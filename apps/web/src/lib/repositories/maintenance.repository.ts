import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay } from "../../mocks/index.js";
import type {
  MaintenanceRecord,
  MaintenanceSchedule,
  MaintenanceHistory,
  MaintenanceType,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceOutcome,
  MaintenanceRecurrence,
} from "@campuscare/shared-types";
import { sdkRequest } from "../api-sdk.js";
import { logger } from "../logger.js";

export interface IMaintenanceRepository extends IRepository<MaintenanceRecord> {
  list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MaintenanceRecord>>;
  listSchedules(params?: { assetId?: string; technicianId?: string }): Promise<any>;
  createSchedule(data: any): Promise<any>;
  assignTechnician(id: string, payload: { technicianId: string | null; clientUpdatedAt?: string | null }): Promise<any>;
  startMaintenance(id: string, payload: { clientUpdatedAt?: string | null }): Promise<any>;
  completeMaintenance(id: string, payload: { actualDuration: number; outcome: string; completionNotes?: string | null; clientUpdatedAt?: string | null }): Promise<any>;
  cancelMaintenance(id: string, payload: { cancellationReason: string; clientUpdatedAt?: string | null }): Promise<any>;
  getSummary(): Promise<any>;
  getTechnicians(): Promise<any>;
  triggerAutomation(): Promise<any>;
}

// In-Memory Mock Data
const mockTechniciansList = [
  { id: "tech-1", firstName: "Sarah", lastName: "Connor", email: "sconnor@campuscare.edu" },
  { id: "tech-2", firstName: "John", lastName: "Doe", email: "jdoe@campuscare.edu" },
  { id: "tech-3", firstName: "Alex", lastName: "Vance", email: "avance@campuscare.edu" },
];

const mockSchedulesList: MaintenanceSchedule[] = [
  {
    id: "sched-1",
    assetId: "1", // Matches first mock asset
    type: "PREVENTIVE" as MaintenanceType,
    technicianId: "tech-1",
    priority: "MEDIUM" as MaintenancePriority,
    recurrence: "MONTHLY" as MaintenanceRecurrence,
    scheduledDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    estimatedDuration: 60,
    notes: "Monthly system checks and server cleaning.",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockRecordsList: MaintenanceRecord[] = [
  {
    id: "rec-1",
    assetId: "1",
    scheduleId: "sched-1",
    type: "PREVENTIVE" as MaintenanceType,
    status: "SCHEDULED" as MaintenanceStatus,
    priority: "MEDIUM" as MaintenancePriority,
    technicianId: "tech-1",
    scheduledDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    estimatedDuration: 60,
    notes: "Monthly system checks.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rec-2",
    assetId: "2",
    scheduleId: null,
    type: "CORRECTIVE" as MaintenanceType,
    status: "IN_PROGRESS" as MaintenanceStatus,
    priority: "HIGH" as MaintenancePriority,
    technicianId: "tech-2",
    scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    estimatedDuration: 120,
    startTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
    notes: "Network router firmware crash repair.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rec-3",
    assetId: "3",
    scheduleId: null,
    type: "HARDWARE_REPAIR" as MaintenanceType,
    status: "COMPLETED" as MaintenanceStatus,
    priority: "CRITICAL" as MaintenancePriority,
    technicianId: "tech-3",
    scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    estimatedDuration: 90,
    actualDuration: 105,
    startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 105 * 60 * 1000),
    notes: "Library workstation RAM replacement.",
    completionNotes: "Replaced faulty DDR4 8GB stick with new 16GB stick. Run tests, system stable.",
    outcome: "SUCCESSFUL" as MaintenanceOutcome,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

class MockMaintenanceRepository implements IMaintenanceRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MaintenanceRecord>> {
    await simulateDelay(null);
    let data = [...mockRecordsList];

    if (params?.search) {
      const q = params.search.toLowerCase();
      data = data.filter(
        (r) =>
          r.notes?.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q)
      );
    }

    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          data = data.filter((r: any) => String(r[key]) === String(val));
        }
      });
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const total = data.length;
    const pageCount = Math.ceil(total / pageSize);
    const paginated = data.slice((page - 1) * pageSize, page * pageSize);

    // Mock asset references
    const enriched = paginated.map((r) => ({
      ...r,
      asset: {
        id: r.assetId,
        name: r.assetId === "1" ? "Principal Database Server" : r.assetId === "2" ? "CISCO core router AP-03" : "Library Client PC-04",
        tag: `CC-TAG-00${r.assetId}`,
        assetCode: `CC-CODE-00${r.assetId}`,
        model: r.assetId === "1" ? "PowerEdge R750" : r.assetId === "2" ? "Catalyst 9300" : "OptiPlex 7090",
        status: "OPERATIONAL",
        lifecycleStage: "AVAILABLE",
      },
      technician: mockTechniciansList.find((t) => t.id === r.technicianId) || null,
    }));

    return {
      data: enriched as any,
      total,
      page,
      pageSize,
      pageCount,
    };
  }

  async get(id: string): Promise<MaintenanceRecord> {
    await simulateDelay(null);
    const record = mockRecordsList.find((r) => r.id === id);
    if (!record) throw new Error("Record not found");

    const enriched = {
      ...record,
      asset: {
        id: record.assetId,
        name: record.assetId === "1" ? "Principal Database Server" : record.assetId === "2" ? "CISCO core router AP-03" : "Library Client PC-04",
        tag: `CC-TAG-00${record.assetId}`,
        assetCode: `CC-CODE-00${record.assetId}`,
        model: record.assetId === "1" ? "PowerEdge R750" : record.assetId === "2" ? "Catalyst 9300" : "OptiPlex 7090",
        location: "Server Room 101, Science Block",
        building: "Science Block",
        floor: "Ground Floor",
        room: "101",
        status: "OPERATIONAL",
        lifecycleStage: "AVAILABLE",
        department: { name: "Central IT Support" },
        category: { name: "Hardware Infrastructure" },
      },
      technician: mockTechniciansList.find((t) => t.id === record.technicianId) || null,
      history: [
        {
          id: "hist-1",
          status: "SCHEDULED" as MaintenanceStatus,
          notes: "Scheduled maintenance order created.",
          createdAt: record.createdAt,
          performedBy: { firstName: "System", lastName: "Scheduler" },
        },
      ],
    };

    return enriched as any;
  }

  async create(data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    throw new Error("Method not supported. Use createSchedule instead.");
  }

  async update(id: string, data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    throw new Error("Method not supported. Use workflow state update methods instead.");
  }

  async delete(id: string): Promise<boolean> {
    await simulateDelay(null);
    const idx = mockRecordsList.findIndex((r) => r.id === id);
    if (idx !== -1) {
      mockRecordsList.splice(idx, 1);
      return true;
    }
    return false;
  }

  async listSchedules(params?: { assetId?: string; technicianId?: string }): Promise<any> {
    await simulateDelay(null);
    let list = [...mockSchedulesList];
    if (params?.assetId) list = list.filter((s) => s.assetId === params.assetId);
    if (params?.technicianId) list = list.filter((s) => s.technicianId === params.technicianId);

    const enriched = list.map((s) => ({
      ...s,
      asset: { name: "Principal Database Server", tag: "CC-TAG-001" },
      technician: mockTechniciansList.find((t) => t.id === s.technicianId) || null,
    }));

    return { data: enriched };
  }

  async createSchedule(data: any): Promise<any> {
    await simulateDelay(null);
    const schedule: MaintenanceSchedule = {
      id: `sched-${Date.now()}`,
      assetId: data.assetId,
      type: data.type,
      technicianId: data.technicianId || null,
      priority: data.priority,
      recurrence: data.recurrence,
      scheduledDate: new Date(data.scheduledDate),
      estimatedDuration: data.estimatedDuration,
      notes: data.notes,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockSchedulesList.push(schedule);

    // Auto generate first record
    const record: MaintenanceRecord = {
      id: `rec-${Date.now()}`,
      assetId: data.assetId,
      scheduleId: schedule.id,
      type: data.type,
      status: "SCHEDULED" as MaintenanceStatus,
      priority: data.priority,
      technicianId: data.technicianId || null,
      scheduledDate: new Date(data.scheduledDate),
      estimatedDuration: data.estimatedDuration,
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockRecordsList.push(record);

    return schedule;
  }

  async assignTechnician(id: string, payload: { technicianId: string | null; clientUpdatedAt?: string | null }): Promise<any> {
    await simulateDelay(null);
    const record = mockRecordsList.find((r) => r.id === id);
    if (!record) throw new Error("Record not found");
    record.technicianId = payload.technicianId;
    if (record.status === "SCHEDULED" && payload.technicianId) {
      record.status = "ASSIGNED" as MaintenanceStatus;
    }
    record.updatedAt = new Date();
    return record;
  }

  async startMaintenance(id: string, payload: { clientUpdatedAt?: string | null }): Promise<any> {
    await simulateDelay(null);
    const record = mockRecordsList.find((r) => r.id === id);
    if (!record) throw new Error("Record not found");
    record.status = "IN_PROGRESS" as MaintenanceStatus;
    record.startTime = new Date();
    record.updatedAt = new Date();
    return record;
  }

  async completeMaintenance(id: string, payload: { actualDuration: number; outcome: string; completionNotes?: string | null; clientUpdatedAt?: string | null }): Promise<any> {
    await simulateDelay(null);
    const record = mockRecordsList.find((r) => r.id === id);
    if (!record) throw new Error("Record not found");
    record.status = "COMPLETED" as MaintenanceStatus;
    record.actualDuration = payload.actualDuration;
    record.outcome = payload.outcome as MaintenanceOutcome;
    record.completionNotes = payload.completionNotes;
    record.endTime = new Date();
    record.updatedAt = new Date();
    return record;
  }

  async cancelMaintenance(id: string, payload: { cancellationReason: string; clientUpdatedAt?: string | null }): Promise<any> {
    await simulateDelay(null);
    const record = mockRecordsList.find((r) => r.id === id);
    if (!record) throw new Error("Record not found");
    record.status = "CANCELLED" as MaintenanceStatus;
    record.cancellationReason = payload.cancellationReason;
    record.updatedAt = new Date();
    return record;
  }

  async getSummary(): Promise<any> {
    await simulateDelay(null);
    return {
      scheduledToday: mockRecordsList.filter((r) => r.status === "SCHEDULED").length,
      upcoming: mockRecordsList.filter((r) => r.status === "ASSIGNED").length,
      overdue: 1,
      inProgress: mockRecordsList.filter((r) => r.status === "IN_PROGRESS").length,
      completed: mockRecordsList.filter((r) => r.status === "COMPLETED").length,
      assetSummary: mockRecordsList.filter((r) => r.status === "IN_PROGRESS").length,
    };
  }

  async getTechnicians(): Promise<any> {
    await simulateDelay(null);
    return mockTechniciansList;
  }

  async triggerAutomation(): Promise<any> {
    await simulateDelay(null);
    return { generatedCount: 0 };
  }
}

class ApiMaintenanceRepository implements IMaintenanceRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MaintenanceRecord>> {
    const filters = params?.filters || {};
    return sdkRequest<RepositoryListResponse<MaintenanceRecord>>({
      method: "GET",
      url: "/maintenance",
      params: {
        page: params?.page,
        pageSize: params?.pageSize,
        search: params?.search,
        ...filters,
      },
    });
  }

  async get(id: string): Promise<MaintenanceRecord> {
    return sdkRequest<MaintenanceRecord>({
      method: "GET",
      url: `/maintenance/${id}`,
    });
  }

  async create(data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    throw new Error("Method not supported");
  }

  async update(id: string, data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    throw new Error("Method not supported");
  }

  async delete(id: string): Promise<boolean> {
    return sdkRequest<boolean>({
      method: "DELETE",
      url: `/maintenance/${id}`,
    });
  }

  async listSchedules(params?: { assetId?: string; technicianId?: string }): Promise<any> {
    return sdkRequest<any>({
      method: "GET",
      url: "/maintenance/schedules",
      params,
    });
  }

  async createSchedule(data: any): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: "/maintenance/schedules",
      data,
    });
  }

  async assignTechnician(id: string, payload: { technicianId: string | null; clientUpdatedAt?: string | null }): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: `/maintenance/${id}/assign`,
      data: payload,
    });
  }

  async startMaintenance(id: string, payload: { clientUpdatedAt?: string | null }): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: `/maintenance/${id}/start`,
      data: payload,
    });
  }

  async completeMaintenance(id: string, payload: { actualDuration: number; outcome: string; completionNotes?: string | null; clientUpdatedAt?: string | null }): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: `/maintenance/${id}/complete`,
      data: payload,
    });
  }

  async cancelMaintenance(id: string, payload: { cancellationReason: string; clientUpdatedAt?: string | null }): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: `/maintenance/${id}/cancel`,
      data: payload,
    });
  }

  async getSummary(): Promise<any> {
    return sdkRequest<any>({
      method: "GET",
      url: "/maintenance/dashboard/summary",
    });
  }

  async getTechnicians(): Promise<any> {
    return sdkRequest<any>({
      method: "GET",
      url: "/maintenance/technicians",
    });
  }

  async triggerAutomation(): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: "/maintenance/automation/trigger",
    });
  }
}

export const maintenanceRepository: IMaintenanceRepository = isMockEnabled()
  ? new MockMaintenanceRepository()
  : new ApiMaintenanceRepository();

export default maintenanceRepository;
