import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay } from "../../mocks/index.js";
import { apiClient } from "../api-client.js";

export interface MockSlaPolicy {
  id: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  displayName: string;
  responseTimeLimit: number;
  resolveTimeLimit: number;
  escalationRoleName: string;
  warningThreshold: number;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SlaComplianceReport {
  complianceRate: number;
  totalResolved: number;
  metCount: number;
  totalBreaches: number;
  activeBreaches: number;
  breachesByPriority: Record<string, number>;
  avgResolveTimeMin: number;
}

export interface ISlaRepository {
  listPolicies(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockSlaPolicy>>;
  getPolicy(id: string): Promise<MockSlaPolicy>;
  createPolicy(data: Partial<MockSlaPolicy>): Promise<MockSlaPolicy>;
  updatePolicy(id: string, data: Partial<MockSlaPolicy>): Promise<MockSlaPolicy>;
  deletePolicy(id: string): Promise<boolean>;
  getCompliance(): Promise<SlaComplianceReport>;
  checkViolations(): Promise<{ escalatedCount: number }>;
}

// ─── Mock Layer ──────────────────────────────────────────────────────────────
const mockPolicies: MockSlaPolicy[] = [
  {
    id: "sla-1",
    priority: "CRITICAL",
    displayName: "Critical Incident SLA",
    responseTimeLimit: 15,
    resolveTimeLimit: 120,
    escalationRoleName: "DEPT_ADMIN",
    warningThreshold: 80,
    color: "#EF4444",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sla-2",
    priority: "HIGH",
    displayName: "High Priority SLA",
    responseTimeLimit: 60,
    resolveTimeLimit: 240,
    escalationRoleName: "DEPT_ADMIN",
    warningThreshold: 80,
    color: "#F59E0B",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sla-3",
    priority: "MEDIUM",
    displayName: "Standard SLA",
    responseTimeLimit: 120,
    resolveTimeLimit: 1440,
    escalationRoleName: "DEPT_ADMIN",
    warningThreshold: 80,
    color: "#3B82F6",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sla-4",
    priority: "LOW",
    displayName: "Low Priority SLA",
    responseTimeLimit: 240,
    resolveTimeLimit: 2880,
    escalationRoleName: "DEPT_ADMIN",
    warningThreshold: 80,
    color: "#10B981",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class MockSlaRepository implements ISlaRepository {
  async listPolicies(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockSlaPolicy>> {
    let list = [...mockPolicies];
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((p) => p.displayName.toLowerCase().includes(q));
    }
    return simulateDelay({
      data: list,
      total: list.length,
      page: 1,
      pageSize: 10,
      pageCount: 1,
    });
  }

  async getPolicy(id: string): Promise<MockSlaPolicy> {
    const item = mockPolicies.find((p) => p.id === id);
    if (!item) throw new Error("Policy not found");
    return simulateDelay(item);
  }

  async createPolicy(data: Partial<MockSlaPolicy>): Promise<MockSlaPolicy> {
    const newItem: MockSlaPolicy = {
      id: `sla-${Date.now()}`,
      priority: data.priority ?? "MEDIUM",
      displayName: data.displayName ?? "New Policy",
      responseTimeLimit: data.responseTimeLimit ?? 120,
      resolveTimeLimit: data.resolveTimeLimit ?? 1440,
      escalationRoleName: data.escalationRoleName ?? "DEPT_ADMIN",
      warningThreshold: data.warningThreshold ?? 80,
      color: data.color ?? null,
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockPolicies.push(newItem);
    return simulateDelay(newItem);
  }

  async updatePolicy(id: string, data: Partial<MockSlaPolicy>): Promise<MockSlaPolicy> {
    const idx = mockPolicies.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Policy not found");
    mockPolicies[idx] = { ...mockPolicies[idx]!, ...data, updatedAt: new Date().toISOString() };
    return simulateDelay(mockPolicies[idx]!);
  }

  async deletePolicy(id: string): Promise<boolean> {
    const idx = mockPolicies.findIndex((p) => p.id === id);
    if (idx === -1) return simulateDelay(false);
    mockPolicies.splice(idx, 1);
    return simulateDelay(true);
  }

  async getCompliance(): Promise<SlaComplianceReport> {
    return simulateDelay({
      complianceRate: 92,
      totalResolved: 25,
      metCount: 23,
      totalBreaches: 2,
      activeBreaches: 1,
      breachesByPriority: { LOW: 0, MEDIUM: 1, HIGH: 1, CRITICAL: 0 },
      avgResolveTimeMin: 185,
    });
  }

  async checkViolations(): Promise<{ escalatedCount: number }> {
    return simulateDelay({ escalatedCount: 0 });
  }
}

// ─── HTTP Layer ──────────────────────────────────────────────────────────────
class HttpSlaRepository implements ISlaRepository {
  async listPolicies(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockSlaPolicy>> {
    const { data } = await apiClient.get("/sla/policies", { params });
    const payload = data.data;
    if (payload && "data" in payload && Array.isArray(payload.data)) {
      return payload;
    }
    const arr = Array.isArray(payload) ? payload : [];
    return {
      data: arr,
      total: arr.length,
      page: 1,
      pageSize: arr.length,
      pageCount: 1,
    };
  }

  async getPolicy(id: string): Promise<MockSlaPolicy> {
    const { data } = await apiClient.get(`/sla/policies/${id}`);
    return data.data;
  }

  async createPolicy(input: Partial<MockSlaPolicy>): Promise<MockSlaPolicy> {
    const { data } = await apiClient.post("/sla/policies", input);
    return data.data;
  }

  async updatePolicy(id: string, input: Partial<MockSlaPolicy>): Promise<MockSlaPolicy> {
    const { data } = await apiClient.put(`/sla/policies/${id}`, input);
    return data.data;
  }

  async deletePolicy(id: string): Promise<boolean> {
    const { data } = await apiClient.delete(`/sla/policies/${id}`);
    return data.data?.deleted ?? data.success ?? false;
  }

  async getCompliance(): Promise<SlaComplianceReport> {
    const { data } = await apiClient.get("/sla/compliance");
    return data.data;
  }

  async checkViolations(): Promise<{ escalatedCount: number }> {
    const { data } = await apiClient.post("/sla/check-violations");
    return data.data;
  }
}

// ─── Proxy Export ────────────────────────────────────────────────────────────
export const slaRepository: ISlaRepository = new Proxy({} as ISlaRepository, {
  get: (_target, prop) => {
    const activeRepo = isMockEnabled() ? new MockSlaRepository() : new HttpSlaRepository();
    return Reflect.get(activeRepo, prop);
  },
});
