import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay, mockCategories } from "../../mocks/index.js";

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
    throw new Error("HTTP Category repository not connected yet.");
  }
  async get(id: string): Promise<MockCategory> {
    throw new Error("HTTP Category repository not connected yet.");
  }
  async create(data: Partial<MockCategory>): Promise<MockCategory> {
    throw new Error("HTTP Category repository not connected yet.");
  }
  async update(id: string, data: Partial<MockCategory>): Promise<MockCategory> {
    throw new Error("HTTP Category repository not connected yet.");
  }
  async delete(id: string): Promise<boolean> {
    throw new Error("HTTP Category repository not connected yet.");
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
