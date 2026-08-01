import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay, mockTickets } from "../../mocks/index.js";
import { apiClient } from "../api-client.js";
import type { MockTicket } from "../../mocks/tickets.js";

export interface ITicketRepository extends IRepository<MockTicket> {
  list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockTicket>>;
  mergeTickets(primaryTicketId: string, secondaryTicketIds: string[]): Promise<MockTicket>;
  verifyTicket(id: string): Promise<MockTicket>;
  reopenTicket(id: string, reason: string): Promise<MockTicket>;
}

// ─── Mock ─────────────────────────────────────────────────────────────────────
class MockTicketRepository implements ITicketRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockTicket>> {
    let list = [...mockTickets];

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.ticketNumber.toLowerCase().includes(q),
      );
    }

    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          if (key === "isIncident") {
            const isInc = val === "true" || val === true;
            list = list.filter((t) => t.isIncident === isInc);
          } else {
            list = list.filter((t: any) => String(t[key]) === String(val));
          }
        }
      });
    }

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    const total = list.length;
    const pageCount = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;

    return simulateDelay({
      data: list.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      pageCount,
    });
  }

  async get(id: string): Promise<MockTicket> {
    const item = mockTickets.find((t) => t.id === id);
    if (!item) throw new Error("Ticket not found");
    return simulateDelay(item);
  }

  async create(data: Partial<MockTicket>): Promise<MockTicket> {
    const newTicket: MockTicket = {
      id: `t-${Date.now()}`,
      ticketNumber: `TIC-${Math.floor(100000 + Math.random() * 900000)}`,
      title: data.title ?? "Untitled Ticket",
      description: data.description ?? "",
      status: "OPEN",
      priority: data.priority ?? "MEDIUM",
      creatorId: data.creatorId ?? "u-3",
      categoryId: data.categoryId ?? "cat-1",
      departmentId: data.departmentId ?? "d-1",
      isIncident: data.isIncident ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTickets.push(newTicket);
    return simulateDelay(newTicket);
  }

  async update(id: string, data: Partial<MockTicket>): Promise<MockTicket> {
    const index = mockTickets.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Ticket not found");
    const updated = { ...mockTickets[index]!, ...data, updatedAt: new Date().toISOString() };
    mockTickets[index] = updated;
    return simulateDelay(updated);
  }

  async delete(id: string): Promise<boolean> {
    const index = mockTickets.findIndex((t) => t.id === id);
    if (index === -1) return simulateDelay(false);
    mockTickets.splice(index, 1);
    return simulateDelay(true);
  }

  async mergeTickets(primaryTicketId: string, secondaryTicketIds: string[]): Promise<MockTicket> {
    const primary = mockTickets.find(t => t.id === primaryTicketId);
    if (!primary) throw new Error("Primary ticket not found");
    for (const secId of secondaryTicketIds) {
      if (secId === primaryTicketId) continue;
      const sec = mockTickets.find(t => t.id === secId);
      if (sec) sec.status = "CLOSED";
    }
    return simulateDelay(primary);
  }

  async verifyTicket(id: string): Promise<MockTicket> {
    const ticket = mockTickets.find(t => t.id === id);
    if (!ticket) throw new Error("Ticket not found");
    ticket.status = "CLOSED";
    return simulateDelay(ticket);
  }

  async reopenTicket(id: string, reason: string): Promise<MockTicket> {
    const ticket = mockTickets.find(t => t.id === id);
    if (!ticket) throw new Error("Ticket not found");
    ticket.status = "ASSIGNED";
    ticket.reopenCount = (ticket.reopenCount ?? 0) + 1;
    ticket.reopenReason = reason;
    return simulateDelay(ticket);
  }
}

// ─── HTTP ────────────────────────────────────────────────────────────────────
function mapApiTicket(t: any): MockTicket {
  return {
    id: t.id,
    ticketNumber: t.ticketNumber,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    creatorId: t.creatorId,
    assigneeId: t.assigneeId ?? undefined,
    categoryId: t.categoryId,
    departmentId: t.departmentId,
    isIncident: t.isIncident ?? false,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    resolvedAt: t.resolvedAt ?? undefined,
    reopenCount: t.reopenCount,
    reopenReason: t.reopenReason,
    dueAt: t.dueAt ?? undefined,
    // expose extra fields the UI may need
    ...(t.creatorName ? { creatorName: t.creatorName } : {}),
    ...(t.assigneeName ? { assigneeName: t.assigneeName } : {}),
    ...(t.categoryName ? { categoryName: t.categoryName } : {}),
    ...(t.departmentName ? { departmentName: t.departmentName } : {}),
    ...(t.comments ? { comments: t.comments } : {}),
    ...(t.incidentLinks ? { incidentLinks: t.incidentLinks } : {}),
  } as MockTicket & Record<string, any>;
}

class HttpTicketRepository implements ITicketRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockTicket>> {
    const { data } = await apiClient.get<{ success: boolean; data: any }>("/tickets", {
      params: {
        search: params?.search || undefined,
        page: params?.page,
        pageSize: params?.pageSize,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
        ...params?.filters,
      },
    });

    const payload = data.data;

    // Paginated envelope
    if (payload && typeof payload === "object" && "data" in payload && Array.isArray(payload.data)) {
      return {
        data: payload.data.map(mapApiTicket),
        total: payload.total ?? payload.data.length,
        page: payload.page ?? 1,
        pageSize: payload.pageSize ?? payload.data.length,
        pageCount: payload.pageCount ?? 1,
      };
    }

    // Fallback: raw array
    const arr = Array.isArray(payload) ? payload : [];
    return {
      data: arr.map(mapApiTicket),
      total: arr.length,
      page: 1,
      pageSize: arr.length,
      pageCount: 1,
    };
  }

  async get(id: string): Promise<MockTicket> {
    const { data } = await apiClient.get<{ success: boolean; data: any }>(`/tickets/${id}`);
    return mapApiTicket(data.data);
  }

  async create(input: Partial<MockTicket> & { categoryId: string; departmentId: string }): Promise<MockTicket> {
    const payload = {
      title: input.title,
      description: input.description,
      priority: input.priority ?? "MEDIUM",
      categoryId: input.categoryId,
      departmentId: input.departmentId,
      assetId: (input as any).assetId ?? null,
    };
    const { data } = await apiClient.post<{ success: boolean; data: any }>("/tickets", payload);
    return mapApiTicket(data.data);
  }

  async update(id: string, input: Partial<MockTicket>): Promise<MockTicket> {
    const { data } = await apiClient.put<{ success: boolean; data: any }>(`/tickets/${id}`, input);
    return mapApiTicket(data.data);
  }

  async delete(id: string): Promise<boolean> {
    const { data } = await apiClient.delete<{ success: boolean; data: any }>(`/tickets/${id}`);
    return data.data?.deleted ?? data.success ?? false;
  }

  async mergeTickets(primaryTicketId: string, secondaryTicketIds: string[]): Promise<MockTicket> {
    const { data } = await apiClient.post<{ success: boolean; data: any }>("/tickets/merge", {
      primaryTicketId,
      secondaryTicketIds,
    });
    return mapApiTicket(data.data);
  }

  async verifyTicket(id: string): Promise<MockTicket> {
    const { data } = await apiClient.post<{ success: boolean; data: any }>(`/tickets/${id}/verify`);
    return mapApiTicket(data.data);
  }

  async reopenTicket(id: string, reason: string): Promise<MockTicket> {
    const { data } = await apiClient.post<{ success: boolean; data: any }>(`/tickets/${id}/reopen`, { reason });
    return mapApiTicket(data.data);
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────
export const ticketRepository: ITicketRepository = new Proxy({} as ITicketRepository, {
  get: (_target, prop) => {
    const activeRepo = isMockEnabled() ? new MockTicketRepository() : new HttpTicketRepository();
    return Reflect.get(activeRepo, prop);
  },
});
