import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay, mockDepartments } from "../../mocks/index.js";
import { apiClient } from "../api-client.js";

export interface MockDepartment {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface IDepartmentRepository extends IRepository<MockDepartment> {
  list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockDepartment>>;
}

class MockDepartmentRepository implements IDepartmentRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockDepartment>> {
    let list = [...mockDepartments];

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      );
    }

    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          list = list.filter((d: any) => String(d[key]) === String(val));
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

  async get(id: string): Promise<MockDepartment> {
    const item = mockDepartments.find((d) => d.id === id);
    if (!item) throw new Error("Department not found");
    return simulateDelay(item);
  }

  async create(data: Partial<MockDepartment>): Promise<MockDepartment> {
    const newDept: MockDepartment = {
      id: `d-${mockDepartments.length + 1}`,
      name: data.name || "New Department",
      code: data.code || `DEPT-${mockDepartments.length + 1}`,
      description: data.description || "",
    };
    mockDepartments.push(newDept);
    return simulateDelay(newDept);
  }

  async update(id: string, data: Partial<MockDepartment>): Promise<MockDepartment> {
    const index = mockDepartments.findIndex((d) => d.id === id);
    if (index === -1) throw new Error("Department not found");
    const updated = {
      ...mockDepartments[index]!,
      ...data,
    };
    mockDepartments[index] = updated;
    return simulateDelay(updated);
  }

  async delete(id: string): Promise<boolean> {
    const index = mockDepartments.findIndex((d) => d.id === id);
    if (index === -1) return simulateDelay(false);
    mockDepartments.splice(index, 1);
    return simulateDelay(true);
  }
}

class HttpDepartmentRepository implements IDepartmentRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockDepartment>> {
    const { data } = await apiClient.get<{ success: boolean; data: MockDepartment[] | RepositoryListResponse<MockDepartment> }>("/departments", {
      params: {
        search: params?.search,
        page: params?.page,
        pageSize: params?.pageSize,
        ...params?.filters,
      },
    });

    // Handle both raw list and paginated response formats if the backend returns array
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

  async get(id: string): Promise<MockDepartment> {
    const { data } = await apiClient.get<{ success: boolean; data: MockDepartment }>(`/departments/${id}`);
    return data.data;
  }

  async create(data: Partial<MockDepartment>): Promise<MockDepartment> {
    const { data: res } = await apiClient.post<{ success: boolean; data: MockDepartment }>("/departments", data);
    return res.data;
  }

  async update(id: string, data: Partial<MockDepartment>): Promise<MockDepartment> {
    const { data: res } = await apiClient.put<{ success: boolean; data: MockDepartment }>(`/departments/${id}`, data);
    return res.data;
  }

  async delete(id: string): Promise<boolean> {
    const { data: res } = await apiClient.delete<{ success: boolean; data: boolean }>(`/departments/${id}`);
    return res.data;
  }
}

export const departmentRepository: IDepartmentRepository = new Proxy(
  {} as IDepartmentRepository,
  {
    get: (target, prop) => {
      const activeRepo = isMockEnabled() ? new MockDepartmentRepository() : new HttpDepartmentRepository();
      return Reflect.get(activeRepo, prop);
    },
  }
);
