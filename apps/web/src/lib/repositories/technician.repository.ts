import { apiClient } from "../api-client.js";

interface Envelope<T> {
  success: boolean;
  data: T;
}

export interface EligibleTechnician {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  workload: number;
}

export interface TechnicianAvailabilityRow {
  technicianId: string;
  technician: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    departmentId: string | null;
  };
  isManuallyUnavailable: boolean;
  unavailableUntil: string | null;
  reason: string | null;
  updatedAt: string;
}

export interface SetUnavailabilityPayload {
  unavailableUntil: string;
  reason?: string | null;
}

/**
 * HTTP access layer for the technicians module (backend: TECH-001).
 * Like privileges, this is inherently server-state (live workload, live
 * availability) — no mock counterpart, always talks to the live API.
 */
class TechnicianRepository {
  async listEligible(departmentId: string): Promise<EligibleTechnician[]> {
    const { data } = await apiClient.get<Envelope<EligibleTechnician[]>>("/technicians/eligible", {
      params: { departmentId },
    });
    return data.data;
  }

  /** Department-agnostic workload for an arbitrary set of technicians (roster view). */
  async getWorkload(technicianIds: string[]): Promise<Record<string, number>> {
    if (technicianIds.length === 0) return {};
    const { data } = await apiClient.get<Envelope<Record<string, number>>>("/technicians/workload", {
      params: { ids: technicianIds.join(",") },
    });
    return data.data;
  }

  /** Self-or-admin single-record read — works without technicians:manage/tickets:assign
   * when the caller is the technician themselves (see technicians.controller.ts). */
  async getAvailabilityForOne(technicianId: string): Promise<{
    id: string;
    technicianId: string;
    isManuallyUnavailable: boolean;
    unavailableUntil: string | null;
    reason: string | null;
  } | null> {
    const { data } = await apiClient.get<Envelope<any>>(`/technicians/${technicianId}/availability`);
    return data.data;
  }

  async listAvailability(departmentId?: string): Promise<TechnicianAvailabilityRow[]> {
    const { data } = await apiClient.get<Envelope<TechnicianAvailabilityRow[]>>(
      "/technicians/availability",
      { params: departmentId ? { departmentId } : {} },
    );
    return data.data;
  }

  async setUnavailability(
    technicianId: string,
    payload: SetUnavailabilityPayload,
  ): Promise<TechnicianAvailabilityRow> {
    const { data } = await apiClient.put<Envelope<TechnicianAvailabilityRow>>(
      `/technicians/${technicianId}/unavailability`,
      payload,
    );
    return data.data;
  }

  async clearUnavailability(technicianId: string): Promise<{ cleared: true }> {
    const { data } = await apiClient.delete<Envelope<{ cleared: true }>>(
      `/technicians/${technicianId}/unavailability`,
    );
    return data.data;
  }

  async autoAssign(ticketId: string): Promise<{ assigneeId: string | null }> {
    const { data } = await apiClient.post<Envelope<{ assigneeId: string | null }>>(
      `/technicians/auto-assign/${ticketId}`,
    );
    return data.data;
  }
}

export const technicianRepository = new TechnicianRepository();
export default technicianRepository;
