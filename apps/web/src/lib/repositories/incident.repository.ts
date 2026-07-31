import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { ticketRepository } from "./ticket.repository.js";
import type { MockTicket } from "../../mocks/tickets.js";

export interface IIncidentRepository extends IRepository<MockTicket> {
  list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockTicket>>;
}

class IncidentRepositoryWrapper implements IIncidentRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockTicket>> {
    const filters = { ...(params?.filters || {}), isIncident: true };
    return ticketRepository.list({
      ...params,
      filters,
    });
  }

  async get(id: string): Promise<MockTicket> {
    const ticket = await ticketRepository.get(id);
    if (!ticket.isIncident) throw new Error("Incident not found");
    return ticket;
  }

  async create(data: Partial<MockTicket>): Promise<MockTicket> {
    return ticketRepository.create({
      ...data,
      isIncident: true,
    });
  }

  async update(id: string, data: Partial<MockTicket>): Promise<MockTicket> {
    return ticketRepository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return ticketRepository.delete(id);
  }
}

export const incidentRepository: IIncidentRepository = new IncidentRepositoryWrapper();
