import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay, mockAssets } from "../../mocks/index.js";
import type { MockAsset } from "../../mocks/assets.js";

export interface IAssetRepository extends IRepository<MockAsset> {
  list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockAsset>>;
}

class MockAssetRepository implements IAssetRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockAsset>> {
    let list = [...mockAssets];

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.tag.toLowerCase().includes(q) ||
          a.serialNumber.toLowerCase().includes(q) ||
          a.model.toLowerCase().includes(q)
      );
    }

    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          list = list.filter((a: any) => String(a[key]) === String(val));
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

  async get(id: string): Promise<MockAsset> {
    const item = mockAssets.find((a) => a.id === id);
    if (!item) throw new Error("Asset not found");
    return simulateDelay(item);
  }

  async create(data: Partial<MockAsset>): Promise<MockAsset> {
    const newAsset: MockAsset = {
      id: `a-${mockAssets.length + 1}`,
      name: data.name || "New Asset",
      tag: data.tag || `CC-GEN-${Math.floor(1000 + Math.random() * 9000)}`,
      serialNumber: data.serialNumber || "SN-UNKNOWN",
      model: data.model || "Generic Model",
      status: data.status || "OPERATIONAL",
      location: data.location || "Central Storage",
      purchaseDate: data.purchaseDate || new Date().toISOString().split("T")[0]!,
      warrantyExpiry: data.warrantyExpiry || new Date().toISOString().split("T")[0]!,
      departmentId: data.departmentId || "d-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockAssets.push(newAsset);
    return simulateDelay(newAsset);
  }

  async update(id: string, data: Partial<MockAsset>): Promise<MockAsset> {
    const index = mockAssets.findIndex((a) => a.id === id);
    if (index === -1) throw new Error("Asset not found");
    const updated = {
      ...mockAssets[index]!,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    mockAssets[index] = updated;
    return simulateDelay(updated);
  }

  async delete(id: string): Promise<boolean> {
    const index = mockAssets.findIndex((a) => a.id === id);
    if (index === -1) return simulateDelay(false);
    mockAssets.splice(index, 1);
    return simulateDelay(true);
  }
}

class HttpAssetRepository implements IAssetRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockAsset>> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async get(id: string): Promise<MockAsset> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async create(data: Partial<MockAsset>): Promise<MockAsset> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async update(id: string, data: Partial<MockAsset>): Promise<MockAsset> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async delete(id: string): Promise<boolean> {
    throw new Error("HTTP Repository not connected yet.");
  }
}

export const assetRepository: IAssetRepository = new Proxy(
  {} as IAssetRepository,
  {
    get: (target, prop) => {
      const activeRepo = isMockEnabled() ? new MockAssetRepository() : new HttpAssetRepository();
      return Reflect.get(activeRepo, prop);
    },
  }
);
