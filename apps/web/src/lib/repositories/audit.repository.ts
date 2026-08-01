import { isMockEnabled, simulateDelay } from "../../mocks/index.js";
import { apiClient } from "../api-client.js";

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  performedBy: string;
  severity: string;
}

export interface IAuditRepository {
  list(): Promise<SystemAuditLog[]>;
}

const mockLogs: SystemAuditLog[] = [
  {
    id: "1",
    timestamp: new Date().toISOString(),
    action: "TICKET_CREATE",
    details: "Created ticket TIC-1029",
    performedBy: "Alex Admin",
    severity: "INFO",
  },
];

class MockAuditRepository implements IAuditRepository {
  async list(): Promise<SystemAuditLog[]> {
    return simulateDelay(mockLogs);
  }
}

class HttpAuditRepository implements IAuditRepository {
  async list(): Promise<SystemAuditLog[]> {
    const { data } = await apiClient.get<{ success: boolean; data: SystemAuditLog[] }>("/audit");
    return data.data;
  }
}

export const auditRepository: IAuditRepository = new Proxy({} as IAuditRepository, {
  get: (_target, prop) => {
    const activeRepo = isMockEnabled() ? new MockAuditRepository() : new HttpAuditRepository();
    return Reflect.get(activeRepo, prop);
  },
});
