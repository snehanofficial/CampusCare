import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay, mockCategories } from "../../mocks/index.js";
import { apiClient } from "../api-client.js";

export interface MockCategory {
  id: string;
  name: string;
  code: string;
  defaultSlaHours: number;
  active: boolean;
}

export interface ICategoryRepository extends IRepository<MockCategory> {
  list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockCategory>>;
}

class MockCategoryRepository implements ICategoryRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockCategory>> {
    let list = [...mockCategories];

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q)
      );
    }

    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          if (key === "active") {
            const isActive = val === "true" || val === true;
            list = list.filter((c) => c.active === isActive);
          } else {
            list = list.filter((c: any) => String(c[key]) === String(val));
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

  async get(id: string): Promise<MockCategory> {
    const item = mockCategories.find((c) => c.id === id);
    if (!item) throw new Error("Category not found");
    return simulateDelay(item);
  }

  async create(data: Partial<MockCategory>): Promise<MockCategory> {
    const newCat: MockCategory = {
      id: `cat-${mockCategories.length + 1}`,
      name: data.name || "New Category",
      code: data.code || `CAT-${mockCategories.length + 1}`,
      defaultSlaHours: data.defaultSlaHours || 8,
      active: data.active !== undefined ? data.active : true,
    };
    mockCategories.push(newCat);
    return simulateDelay(newCat);
  }

  async update(id: string, data: Partial<MockCategory>): Promise<MockCategory> {
    const index = mockCategories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Category not found");
    const updated = {
      ...mockCategories[index]!,
      ...data,
    };
    mockCategories[index] = updated;
    return simulateDelay(updated);
  }

  async delete(id: string): Promise<boolean> {
    const index = mockCategories.findIndex((c) => c.id === id);
    if (index === -1) return simulateDelay(false);
    mockCategories.splice(index, 1);
    return simulateDelay(true);
  }
}

class HttpCategoryRepository implements ICategoryRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockCategory>> {
    const { data } = await apiClient.get<{ success: boolean; data: any[] | RepositoryListResponse<any> }>("/categories", {
      params: {
        search: params?.search,
        page: params?.page,
        pageSize: params?.pageSize,
        ...params?.filters,
      },
    });

    const formatCategory = (cat: any): MockCategory => ({
      id: cat.id,
      name: cat.name,
      code: cat.name.substring(0, 4).toUpperCase().replace(/\s/g, "_"),
      defaultSlaHours: 8,
      active: cat.isActive !== undefined ? cat.isActive : true,
    });

    if (Array.isArray(data.data)) {
      return {
        data: data.data.map(formatCategory),
        total: data.data.length,
        page: 1,
        pageSize: data.data.length,
        pageCount: 1,
      };
    }

    return {
      data: data.data.data.map(formatCategory),
      total: data.data.total,
      page: data.data.page,
      pageSize: data.data.pageSize,
      pageCount: data.data.pageCount,
    };
  }

  async get(id: string): Promise<MockCategory> {
    const { data } = await apiClient.get<{ success: boolean; data: any }>(`/categories/${id}`);
    const cat = data.data;
    return {
      id: cat.id,
      name: cat.name,
      code: cat.name.substring(0, 4).toUpperCase().replace(/\s/g, "_"),
      defaultSlaHours: 8,
      active: cat.isActive,
    };
  }

  async create(data: Partial<MockCategory>): Promise<MockCategory> {
    const payload = {
      name: data.name,
      description: data.name,
      sortOrder: 0,
    };
    const { data: res } = await apiClient.post<{ success: boolean; data: any }>("/categories", payload);
    const cat = res.data;
    return {
      id: cat.id,
      name: cat.name,
      code: cat.name.substring(0, 4).toUpperCase().replace(/\s/g, "_"),
      defaultSlaHours: 8,
      active: cat.isActive,
    };
  }

  async update(id: string, data: Partial<MockCategory>): Promise<MockCategory> {
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.active !== undefined) payload.isActive = data.active;

    const { data: res } = await apiClient.put<{ success: boolean; data: any }>(`/categories/${id}`, payload);
    const cat = res.data;
    return {
      id: cat.id,
      name: cat.name,
      code: cat.name.substring(0, 4).toUpperCase().replace(/\s/g, "_"),
      defaultSlaHours: 8,
      active: cat.isActive,
    };
  }

  async delete(id: string): Promise<boolean> {
    const { data: res } = await apiClient.delete<{ success: boolean; data: any }>(`/categories/${id}`);
    return res.data.deleted || res.data.deactivated || res.success;
  }
}

export const categoryRepository: ICategoryRepository = new Proxy(
  {} as ICategoryRepository,
  {
    get: (target, prop) => {
      const activeRepo = isMockEnabled() ? new MockCategoryRepository() : new HttpCategoryRepository();
      return Reflect.get(activeRepo, prop);
    },
  }
);
