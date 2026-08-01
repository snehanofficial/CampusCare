import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay } from "../../mocks/index.js";
import { apiClient } from "../api-client.js";
import { ticketRepository } from "./ticket.repository.js";
import type { MockTicket } from "../../mocks/tickets.js";

export interface MockIncident {
  id: string;
  title: string;
  description: string;
  rootCause: string | null;
  status: string;
  severity: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  linkedTickets: Array<{
    id: string;
    ticketNumber: string;
    title: string;
    status: string;
    priority: string;
  }>;
  linkedTicketCount: number;
}

export interface IIncidentRepository {
  list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockIncident>>;
  get(id: string): Promise<MockIncident>;
  create(data: Partial<MockIncident> & { ticketIds?: string[] }): Promise<MockIncident>;
  update(id: string, data: Partial<MockIncident> & { ticketIds?: string[] }): Promise<MockIncident>;
  delete(id: string): Promise<boolean>;
  getTimeline(id: string): Promise<any[]>;
}

// ─── Mock (uses ticket mock to derive incidents) ──────────────────────────────
class MockIncidentRepository implements IIncidentRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockIncident>> {
    // Pull incident-tagged tickets from mock layer
    const ticketResponse = await ticketRepository.list({
      ...params,
      filters: { ...(params?.filters ?? {}), isIncident: "true" },
    });

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    const incidents: MockIncident[] = ticketResponse.data.map((t: MockTicket) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      rootCause: null,
      status: t.status,
      severity: t.priority, // map ticket priority → incident severity
      resolvedAt: t.resolvedAt ?? null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      linkedTickets: [],
      linkedTicketCount: 0,
    }));

    return {
      data: incidents,
      total: incidents.length,
      page,
      pageSize,
      pageCount: Math.ceil(incidents.length / pageSize),
    };
  }

  async get(id: string): Promise<MockIncident> {
    const ticket = await ticketRepository.get(id);
    if (!ticket.isIncident) throw new Error("Incident not found");
    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      rootCause: null,
      status: ticket.status,
      severity: ticket.priority,
      resolvedAt: ticket.resolvedAt ?? null,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      linkedTickets: [],
      linkedTicketCount: 0,
    };
  }

  async create(data: Partial<MockIncident>): Promise<MockIncident> {
    return simulateDelay({
      id: `inc-${Date.now()}`,
      title: data.title ?? "Untitled Incident",
      description: data.description ?? "",
      rootCause: null,
      status: "OPEN",
      severity: data.severity ?? "HIGH",
      resolvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      linkedTickets: [],
      linkedTicketCount: 0,
    });
  }

  async update(id: string, data: Partial<MockIncident>): Promise<MockIncident> {
    const existing = await this.get(id);
    return simulateDelay({ ...existing, ...data, updatedAt: new Date().toISOString() });
  }

  async delete(_id: string): Promise<boolean> {
    return simulateDelay(true);
  }

  async getTimeline(id: string): Promise<any[]> {
    return simulateDelay([
      { id: "log-1", action: "INCIDENT_CREATE", newValue: { title: "Mock Switch Failure" }, performedByName: "System Admin", createdAt: new Date().toISOString() }
    ]);
  }
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────
function mapApiIncident(inc: any): MockIncident {
  return {
    id: inc.id,
    title: inc.title,
    description: inc.description,
    rootCause: inc.rootCause ?? null,
    status: inc.status,
    severity: inc.severity,
    resolvedAt: inc.resolvedAt ?? null,
    createdAt: inc.createdAt,
    updatedAt: inc.updatedAt,
    linkedTickets: inc.linkedTickets ?? [],
    linkedTicketCount: inc.linkedTicketCount ?? inc.linkedTickets?.length ?? 0,
  };
}

class HttpIncidentRepository implements IIncidentRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockIncident>> {
    const { data } = await apiClient.get<{ success: boolean; data: any }>("/incidents", {
      params: {
        search: params?.search || undefined,
        page: params?.page,
        pageSize: params?.pageSize,
        ...params?.filters,
      },
    });

    const payload = data.data;
    if (payload && "data" in payload && Array.isArray(payload.data)) {
      return {
        data: payload.data.map(mapApiIncident),
        total: payload.total,
        page: payload.page,
        pageSize: payload.pageSize,
        pageCount: payload.pageCount,
      };
    }

    const arr = Array.isArray(payload) ? payload : [];
    return {
      data: arr.map(mapApiIncident),
      total: arr.length,
      page: 1,
      pageSize: arr.length,
      pageCount: 1,
    };
  }

  async get(id: string): Promise<MockIncident> {
    const { data } = await apiClient.get<{ success: boolean; data: any }>(`/incidents/${id}`);
    return mapApiIncident(data.data);
  }

  async create(input: Partial<MockIncident> & { ticketIds?: string[] }): Promise<MockIncident> {
    const payload = {
      title: input.title,
      description: input.description,
      severity: input.severity ?? "HIGH",
      status: input.status ?? "OPEN",
      rootCause: input.rootCause ?? null,
      ticketIds: input.ticketIds ?? [],
    };
    const { data } = await apiClient.post<{ success: boolean; data: any }>("/incidents", payload);
    return mapApiIncident(data.data);
  }

  async update(id: string, input: Partial<MockIncident> & { ticketIds?: string[] }): Promise<MockIncident> {
    const { data } = await apiClient.put<{ success: boolean; data: any }>(`/incidents/${id}`, input);
    return mapApiIncident(data.data);
  }

  async delete(id: string): Promise<boolean> {
    const { data } = await apiClient.delete<{ success: boolean; data: any }>(`/incidents/${id}`);
    return data.data?.deleted ?? data.success ?? false;
  }

  async getTimeline(id: string): Promise<any[]> {
    const { data } = await apiClient.get<{ success: boolean; data: any }>(`/incidents/${id}/timeline`);
    return data.data;
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────
export const incidentRepository: IIncidentRepository = new Proxy({} as IIncidentRepository, {
  get: (_target, prop) => {
    const activeRepo = isMockEnabled() ? new MockIncidentRepository() : new HttpIncidentRepository();
    return Reflect.get(activeRepo, prop);
  },
});
