import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay } from "../../mocks/index.js";
import type { AssetCategory } from "@campuscare/shared-types";
import { sdkRequest } from "../api-sdk.js";

export interface IAssetCategoryRepository extends IRepository<AssetCategory> {
  list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<AssetCategory>>;
}

// Local mock storage for asset categories
const mockAssetCategories: AssetCategory[] = [
  { id: "ac-1", name: "Laptops & Workstations", description: "Portable laptops, tablets, and desktop workstations", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "ac-2", name: "Network Equipment", description: "Routers, switches, access points, and hubs", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "ac-3", name: "Servers & Racks", description: "Rackmount servers, blades, and datacenter infrastructure", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "ac-4", name: "Printers & Peripherals", description: "Office printers, projectors, screens, and input devices", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

class MockAssetCategoryRepository implements IAssetCategoryRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<AssetCategory>> {
    let list = [...mockAssetCategories];

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)));
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

  async get(id: string): Promise<AssetCategory> {
    const item = mockAssetCategories.find((c) => c.id === id);
    if (!item) throw new Error("Asset category not found");
    return simulateDelay(item);
  }

  async create(data: Partial<AssetCategory>): Promise<AssetCategory> {
    const newCat: AssetCategory = {
      id: `ac-${mockAssetCategories.length + 1}`,
      name: data.name || "New Category",
      description: data.description || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockAssetCategories.push(newCat);
    return simulateDelay(newCat);
  }

  async update(id: string, data: Partial<AssetCategory>): Promise<AssetCategory> {
    const index = mockAssetCategories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Asset category not found");
    const updated = {
      ...mockAssetCategories[index]!,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    mockAssetCategories[index] = updated;
    return simulateDelay(updated);
  }

  async delete(id: string): Promise<boolean> {
    const index = mockAssetCategories.findIndex((c) => c.id === id);
    if (index === -1) return simulateDelay(false);
    mockAssetCategories[index]!.isActive = false;
    return simulateDelay(true);
  }
}

class HttpAssetCategoryRepository implements IAssetCategoryRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<AssetCategory>> {
    const res = await sdkRequest<AssetCategory[]>({
      method: "GET",
      url: "/assets/categories",
    });
    return {
      data: res || [],
      total: res?.length || 0,
      page: 1,
      pageSize: 100,
      pageCount: 1
    };
  }

  async get(id: string): Promise<AssetCategory> {
    throw new Error("Get single category not supported");
  }

  async create(data: Partial<AssetCategory>): Promise<AssetCategory> {
    return sdkRequest<AssetCategory>({
      method: "POST",
      url: "/assets/categories",
      data,
    });
  }

  async update(id: string, data: Partial<AssetCategory>): Promise<AssetCategory> {
    return sdkRequest<AssetCategory>({
      method: "PUT",
      url: `/assets/categories/${id}`,
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    await sdkRequest<any>({
      method: "DELETE",
      url: `/assets/categories/${id}`,
    });
    return true;
  }
}

export const assetCategoryRepository: IAssetCategoryRepository = new Proxy(
  {} as IAssetCategoryRepository,
  {
    get: (target, prop) => {
      const activeRepo = isMockEnabled() ? new MockAssetCategoryRepository() : new HttpAssetCategoryRepository();
      return Reflect.get(activeRepo, prop);
    },
  }
);
