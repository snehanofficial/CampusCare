import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay } from "../../mocks/index.js";
import { apiClient } from "../api-client.js";

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
}

export interface IRoleRepository extends IRepository<Role> {
  list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<Role>>;
}

const mockRoles: Role[] = [
  { id: "r-1", name: "SYSTEM_ADMIN", displayName: "System Administrator", description: "Full system access", isSystem: true },
  { id: "r-2", name: "DEPT_ADMIN", displayName: "Department Administrator", description: "Department management access", isSystem: true },
  { id: "r-3", name: "TECHNICIAN", displayName: "IT Technician", description: "IT support technician access", isSystem: true },
  { id: "r-4", name: "FACULTY", displayName: "Faculty / Staff", description: "Campus faculty access", isSystem: true },
  { id: "r-5", name: "STUDENT", displayName: "Student", description: "Campus student access", isSystem: true },
];

class MockRoleRepository implements IRoleRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<Role>> {
    let list = [...mockRoles];

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((r) => r.displayName.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
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

  async get(id: string): Promise<Role> {
    const item = mockRoles.find((r) => r.id === id);
    if (!item) throw new Error("Role not found");
    return simulateDelay(item);
  }

  async create(data: Partial<Role>): Promise<Role> {
    throw new Error("Creating roles is not supported.");
  }

  async update(id: string, data: Partial<Role>): Promise<Role> {
    throw new Error("Updating roles is not supported.");
  }

  async delete(id: string): Promise<boolean> {
    throw new Error("Deleting roles is not supported.");
  }
}

class HttpRoleRepository implements IRoleRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<Role>> {
    const { data } = await apiClient.get<{ success: boolean; data: Role[] | RepositoryListResponse<Role> }>("/roles", {
      params: {
        search: params?.search,
        page: params?.page,
        pageSize: params?.pageSize,
        ...params?.filters,
      },
    });

    if (Array.isArray(data.data)) {
      return {
        data: data.data,
        total: data.data.length,
        page: 1,
        pageSize: data.data.length,
        pageCount: 1,
      };
    }
    return data.data;
  }

  async get(id: string): Promise<Role> {
    const { data } = await apiClient.get<{ success: boolean; data: Role }>(`/roles/${id}`);
    return data.data;
  }

  async create(data: Partial<Role>): Promise<Role> {
    const { data: res } = await apiClient.post<{ success: boolean; data: Role }>("/roles", data);
    return res.data;
  }

  async update(id: string, data: Partial<Role>): Promise<Role> {
    const { data: res } = await apiClient.put<{ success: boolean; data: Role }>(`/roles/${id}`, data);
    return res.data;
  }

  async delete(id: string): Promise<boolean> {
    const { data: res } = await apiClient.delete<{ success: boolean; data: boolean }>(`/roles/${id}`);
    return res.data;
  }
}

export const roleRepository: IRoleRepository = new Proxy(
  {} as IRoleRepository,
  {
    get: (target, prop) => {
      const activeRepo = isMockEnabled() ? new MockRoleRepository() : new HttpRoleRepository();
      return Reflect.get(activeRepo, prop);
    },
  }
);
