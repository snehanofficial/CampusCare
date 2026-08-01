import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay } from "../../mocks/index.js";
import { apiClient } from "../api-client.js";

export interface MockAutomationRule {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  priority: number;
  trigger: "ON_CREATE" | "ON_UPDATE" | "ON_STATUS_CHANGE";
  conditions: Array<{ field: string; operator: string; value?: any }>;
  actions: Array<{ type: string; value?: any }>;
  executionCount: number;
  logCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MockAutomationLog {
  id: string;
  ruleId: string;
  ruleName: string | null;
  ticketId: string;
  triggered: boolean;
  actionsRun: string[];
  createdAt: string;
}

export interface IAutomationRepository {
  listRules(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockAutomationRule>>;
  getRule(id: string): Promise<MockAutomationRule>;
  createRule(data: Partial<MockAutomationRule>): Promise<MockAutomationRule>;
  updateRule(id: string, data: Partial<MockAutomationRule>): Promise<MockAutomationRule>;
  deleteRule(id: string): Promise<boolean>;
  listLogs(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockAutomationLog>>;
}

// ─── Mock Layer ──────────────────────────────────────────────────────────────
const mockRules: MockAutomationRule[] = [
  {
    id: "ar-1",
    name: "Auto-Assign Critical to Admin",
    description: "Automatically routes critical tickets to administrative users.",
    isActive: true,
    priority: 10,
    trigger: "ON_CREATE",
    conditions: [{ field: "priority", operator: "eq", value: "CRITICAL" }],
    actions: [{ type: "ASSIGN_TO", value: "admin-uuid" }],
    executionCount: 15,
    logCount: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockLogs: MockAutomationLog[] = [
  {
    id: "al-1",
    ruleId: "ar-1",
    ruleName: "Auto-Assign Critical to Admin",
    ticketId: "t-1",
    triggered: true,
    actionsRun: ["ASSIGN_TO:admin-uuid"],
    createdAt: new Date().toISOString(),
  },
];

class MockAutomationRepository implements IAutomationRepository {
  async listRules(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockAutomationRule>> {
    let rules = [...mockRules];
    if (params?.search) {
      const q = params.search.toLowerCase();
      rules = rules.filter((r) => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
    }
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    const total = rules.length;
    return simulateDelay({
      data: rules.slice((page - 1) * pageSize, page * pageSize),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    });
  }

  async getRule(id: string): Promise<MockAutomationRule> {
    const item = mockRules.find((r) => r.id === id);
    if (!item) throw new Error("Rule not found");
    return simulateDelay(item);
  }

  async createRule(data: Partial<MockAutomationRule>): Promise<MockAutomationRule> {
    const newItem: MockAutomationRule = {
      id: `ar-${Date.now()}`,
      name: data.name ?? "New Rule",
      description: data.description ?? null,
      isActive: data.isActive ?? true,
      priority: data.priority ?? 0,
      trigger: data.trigger ?? "ON_CREATE",
      conditions: data.conditions ?? [],
      actions: data.actions ?? [],
      executionCount: 0,
      logCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockRules.push(newItem);
    return simulateDelay(newItem);
  }

  async updateRule(id: string, data: Partial<MockAutomationRule>): Promise<MockAutomationRule> {
    const idx = mockRules.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Rule not found");
    mockRules[idx] = {
      ...mockRules[idx]!,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return simulateDelay(mockRules[idx]!);
  }

  async deleteRule(id: string): Promise<boolean> {
    const idx = mockRules.findIndex((r) => r.id === id);
    if (idx === -1) return simulateDelay(false);
    mockRules.splice(idx, 1);
    return simulateDelay(true);
  }

  async listLogs(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockAutomationLog>> {
    let logs = [...mockLogs];
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    const total = logs.length;
    return simulateDelay({
      data: logs.slice((page - 1) * pageSize, page * pageSize),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    });
  }
}

// ─── HTTP Layer ──────────────────────────────────────────────────────────────
class HttpAutomationRepository implements IAutomationRepository {
  async listRules(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockAutomationRule>> {
    const { data } = await apiClient.get("/automation/rules", {
      params: {
        search: params?.search || undefined,
        page: params?.page,
        pageSize: params?.pageSize,
        ...params?.filters,
      },
    });
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

  async getRule(id: string): Promise<MockAutomationRule> {
    const { data } = await apiClient.get(`/automation/rules/${id}`);
    return data.data;
  }

  async createRule(input: Partial<MockAutomationRule>): Promise<MockAutomationRule> {
    const { data } = await apiClient.post("/automation/rules", input);
    return data.data;
  }

  async updateRule(id: string, input: Partial<MockAutomationRule>): Promise<MockAutomationRule> {
    const { data } = await apiClient.put(`/automation/rules/${id}`, input);
    return data.data;
  }

  async deleteRule(id: string): Promise<boolean> {
    const { data } = await apiClient.delete(`/automation/rules/${id}`);
    return data.data?.deleted ?? data.success ?? false;
  }

  async listLogs(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockAutomationLog>> {
    const { data } = await apiClient.get("/automation/logs", {
      params: {
        page: params?.page,
        pageSize: params?.pageSize,
        ...params?.filters,
      },
    });
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
}

// ─── Proxy Export ────────────────────────────────────────────────────────────
export const automationRepository: IAutomationRepository = new Proxy({} as IAutomationRepository, {
  get: (_target, prop) => {
    const activeRepo = isMockEnabled() ? new MockAutomationRepository() : new HttpAutomationRepository();
    return Reflect.get(activeRepo, prop);
  },
});
