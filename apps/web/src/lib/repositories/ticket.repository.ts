import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay, mockTickets } from "../../mocks/index.js";
import type { MockTicket } from "../../mocks/tickets.js";

export interface ITicketRepository extends IRepository<MockTicket> {
  list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockTicket>>;
}

class MockTicketRepository implements ITicketRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockTicket>> {
    let list = [...mockTickets];

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.ticketNumber.toLowerCase().includes(q)
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

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const total = list.length;
    const pageCount = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = list.slice(start, start + pageSize);

    return simulateDelay({
      data,
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
      id: `t-${mockTickets.length + 1}`,
      ticketNumber: `INC-${1029 + mockTickets.length}`,
      title: data.title || "Untitled Ticket",
      description: data.description || "",
      status: "OPEN",
      priority: data.priority || "MEDIUM",
      creatorId: data.creatorId || "u-3",
      categoryId: data.categoryId || "cat-1",
      departmentId: data.departmentId || "d-1",
      isIncident: data.isIncident || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTickets.push(newTicket);
    return simulateDelay(newTicket);
  }

  async update(id: string, data: Partial<MockTicket>): Promise<MockTicket> {
    const index = mockTickets.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Ticket not found");
    const updated = {
      ...mockTickets[index]!,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    mockTickets[index] = updated;
    return simulateDelay(updated);
  }

  async delete(id: string): Promise<boolean> {
    const index = mockTickets.findIndex((t) => t.id === id);
    if (index === -1) return simulateDelay(false);
    mockTickets.splice(index, 1);
    return simulateDelay(true);
  }
}

class HttpTicketRepository implements ITicketRepository {
  // Direct HTTP adapter to call backend APIs in the future
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockTicket>> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async get(id: string): Promise<MockTicket> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async create(data: Partial<MockTicket>): Promise<MockTicket> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async update(id: string, data: Partial<MockTicket>): Promise<MockTicket> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async delete(id: string): Promise<boolean> {
    throw new Error("HTTP Repository not connected yet.");
  }
}

export const ticketRepository: ITicketRepository = new Proxy(
  {} as ITicketRepository,
  {
    get: (target, prop) => {
      const activeRepo = isMockEnabled() ? new MockTicketRepository() : new HttpTicketRepository();
      return Reflect.get(activeRepo, prop);
    },
  }
);
