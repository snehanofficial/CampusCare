import { apiClient } from "../api-client.js";
import type {
  ApprovalPolicy,
  EffectivePrivileges,
  PaginatedPrivileges,
  PermissionRegistry,
  PermissionTemplate,
  TemporaryGrant,
  TemporaryPermissionRequest,
} from "../../features/privileges/types/index.js";

interface Envelope<T> {
  success: boolean;
  data: T;
}

export interface PrivilegeListParams {
  search?: string;
  status?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateRequestPayload {
  permissionIds: string[];
  reason: string;
  durationMinutes: number;
}

export interface GrantAccessPayload {
  userId: string;
  permissionIds: string[];
  durationMinutes: number;
  reason: string;
  templateId?: string | null;
}

export interface TemplatePayload {
  name: string;
  description?: string | null;
  defaultDurationMinutes: number;
  permissionIds: string[];
}

export interface PolicyUpdatePayload {
  approvalLevel?: string;
  approverRole?: string;
  maxDurationMinutes?: number;
  autoApprove?: boolean;
  isActive?: boolean;
}

/**
 * HTTP access layer for the GTPE endpoints.
 * Unlike the CRUD repositories this feature has no mock counterpart — temporary
 * privileges are inherently server-state, so it always talks to the live API.
 */
class PrivilegeRepository {
  // ─── Registry ────────────────────────────────────────────────────────────────
  async getPermissionRegistry(): Promise<PermissionRegistry> {
    const { data } = await apiClient.get<Envelope<PermissionRegistry>>("/permissions/registry");
    return data.data;
  }

  // ─── Requests ────────────────────────────────────────────────────────────────
  async createRequest(payload: CreateRequestPayload): Promise<TemporaryPermissionRequest> {
    const { data } = await apiClient.post<Envelope<TemporaryPermissionRequest>>(
      "/privileges/request",
      payload,
    );
    return data.data;
  }

  async listMyRequests(
    params?: PrivilegeListParams,
  ): Promise<PaginatedPrivileges<TemporaryPermissionRequest>> {
    const { data } = await apiClient.get<Envelope<PaginatedPrivileges<TemporaryPermissionRequest>>>(
      "/privileges/my",
      { params },
    );
    return data.data;
  }

  async getMyEffective(): Promise<EffectivePrivileges> {
    const { data } = await apiClient.get<Envelope<EffectivePrivileges>>("/privileges/my/effective");
    return data.data;
  }

  async listPending(
    params?: PrivilegeListParams,
  ): Promise<PaginatedPrivileges<TemporaryPermissionRequest>> {
    const { data } = await apiClient.get<Envelope<PaginatedPrivileges<TemporaryPermissionRequest>>>(
      "/privileges/pending",
      { params },
    );
    return data.data;
  }

  async approve(id: string, note?: string): Promise<TemporaryPermissionRequest> {
    const { data } = await apiClient.post<Envelope<TemporaryPermissionRequest>>(
      `/privileges/${id}/approve`,
      { note },
    );
    return data.data;
  }

  async reject(id: string, note: string): Promise<TemporaryPermissionRequest> {
    const { data } = await apiClient.post<Envelope<TemporaryPermissionRequest>>(
      `/privileges/${id}/reject`,
      { note },
    );
    return data.data;
  }

  async cancel(id: string): Promise<TemporaryPermissionRequest> {
    const { data } = await apiClient.post<Envelope<TemporaryPermissionRequest>>(
      `/privileges/${id}/cancel`,
      {},
    );
    return data.data;
  }

  // ─── Grants ──────────────────────────────────────────────────────────────────
  async grant(payload: GrantAccessPayload): Promise<TemporaryGrant[]> {
    const { data } = await apiClient.post<Envelope<TemporaryGrant[]>>("/privileges/grant", payload);
    return data.data;
  }

  async listActive(params?: PrivilegeListParams): Promise<PaginatedPrivileges<TemporaryGrant>> {
    const { data } = await apiClient.get<Envelope<PaginatedPrivileges<TemporaryGrant>>>(
      "/privileges/active",
      { params },
    );
    return data.data;
  }

  async listHistory(params?: PrivilegeListParams): Promise<PaginatedPrivileges<TemporaryGrant>> {
    const { data } = await apiClient.get<Envelope<PaginatedPrivileges<TemporaryGrant>>>(
      "/privileges/history",
      { params },
    );
    return data.data;
  }

  async exportHistoryCsv(params?: PrivilegeListParams): Promise<Blob> {
    const { data } = await apiClient.get<Blob>("/privileges/history", {
      params: { ...params, format: "csv" },
      responseType: "blob",
    });
    return data;
  }

  async revoke(grantId: string, reason: string): Promise<TemporaryGrant> {
    const { data } = await apiClient.post<Envelope<TemporaryGrant>>(
      `/privileges/grants/${grantId}/revoke`,
      { reason },
    );
    return data.data;
  }

  // ─── Templates ───────────────────────────────────────────────────────────────
  async listTemplates(): Promise<PermissionTemplate[]> {
    const { data } = await apiClient.get<Envelope<PermissionTemplate[]>>("/privileges/templates");
    return data.data;
  }

  async createTemplate(payload: TemplatePayload): Promise<PermissionTemplate> {
    const { data } = await apiClient.post<Envelope<PermissionTemplate>>(
      "/privileges/templates",
      payload,
    );
    return data.data;
  }

  async updateTemplate(
    id: string,
    payload: Partial<TemplatePayload> & { isActive?: boolean },
  ): Promise<PermissionTemplate> {
    const { data } = await apiClient.put<Envelope<PermissionTemplate>>(
      `/privileges/templates/${id}`,
      payload,
    );
    return data.data;
  }

  async deleteTemplate(id: string): Promise<PermissionTemplate> {
    const { data } = await apiClient.delete<Envelope<PermissionTemplate>>(
      `/privileges/templates/${id}`,
    );
    return data.data;
  }

  // ─── Approval policies ───────────────────────────────────────────────────────
  async listPolicies(): Promise<ApprovalPolicy[]> {
    const { data } = await apiClient.get<Envelope<ApprovalPolicy[]>>("/privileges/policies");
    return data.data;
  }

  async updatePolicy(id: string, payload: PolicyUpdatePayload): Promise<ApprovalPolicy> {
    const { data } = await apiClient.put<Envelope<ApprovalPolicy>>(
      `/privileges/policies/${id}`,
      payload,
    );
    return data.data;
  }
}

export const privilegeRepository = new PrivilegeRepository();
