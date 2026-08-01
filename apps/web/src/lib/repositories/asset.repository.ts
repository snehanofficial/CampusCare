import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay, mockAssets } from "../../mocks/index.js";
import type { Asset } from "@campuscare/shared-types";
import { sdkRequest } from "../api-sdk.js";
import { logger } from "../logger.js";

export interface IAssetRepository extends IRepository<Asset> {
  list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<Asset>>;
  bulkAction(
    action: "validate" | "create" | "update" | "assign" | "transfer" | "retire" | "qr",
    assetIds?: string[],
    assets?: Partial<Asset>[],
    payload?: any
  ): Promise<any>;
}

class MockAssetRepository implements IAssetRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<Asset>> {
    let list = [...(mockAssets as any[])];

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.tag.toLowerCase().includes(q) ||
          (a.assetCode && a.assetCode.toLowerCase().includes(q)) ||
          (a.serialNumber && a.serialNumber.toLowerCase().includes(q)) ||
          (a.model && a.model.toLowerCase().includes(q)) ||
          (a.manufacturer && a.manufacturer.toLowerCase().includes(q))
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

  async get(id: string): Promise<Asset> {
    const item = mockAssets.find((a) => a.id === id);
    if (!item) throw new Error("Asset not found");
    return simulateDelay(item as any);
  }

  async create(data: Partial<Asset>): Promise<Asset> {
    const newAsset: any = {
      id: `a-${mockAssets.length + 1}`,
      name: data.name || "New Asset",
      assetCode: data.assetCode || `AST-2026-000${mockAssets.length + 1}`,
      tag: data.tag || `CC-GEN-${Math.floor(1000 + Math.random() * 9000)}`,
      qrCodeId: data.qrCodeId || data.tag || `CC-GEN-${Math.floor(1000 + Math.random() * 9000)}`,
      serialNumber: data.serialNumber || "SN-UNKNOWN",
      model: data.model || "Generic Model",
      manufacturer: data.manufacturer || "Generic",
      status: data.status || "OPERATIONAL",
      lifecycleStage: data.lifecycleStage || "PROCURED",
      healthStatus: data.healthStatus || "HEALTHY",
      location: data.location || "Central Storage",
      building: data.building || null,
      floor: data.floor || null,
      room: data.room || null,
      departmentId: data.departmentId || "d-1",
      categoryId: data.categoryId || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockAssets.push(newAsset);
    return simulateDelay(newAsset);
  }

  async update(id: string, data: Partial<Asset>): Promise<Asset> {
    const index = mockAssets.findIndex((a) => a.id === id);
    if (index === -1) throw new Error("Asset not found");
    const updated = {
      ...mockAssets[index]!,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    mockAssets[index] = updated as any;
    return simulateDelay(updated as any);
  }

  async delete(id: string): Promise<boolean> {
    const index = mockAssets.findIndex((a) => a.id === id);
    if (index === -1) return simulateDelay(false);
    mockAssets.splice(index, 1);
    return simulateDelay(true);
  }

  async bulkAction(
    action: "validate" | "create" | "update" | "assign" | "transfer" | "retire" | "qr",
    assetIds?: string[],
    assets?: Partial<Asset>[],
    payload?: any
  ): Promise<any> {
    logger.debug("asset-repository", `Mocking bulk action: ${action}`);
    return simulateDelay({ success: true, count: assetIds?.length || assets?.length || 0 });
  }
}

class HttpAssetRepository implements IAssetRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<Asset>> {
    return sdkRequest<RepositoryListResponse<Asset>>({
      method: "GET",
      url: "/assets",
      params: {
        search: params?.search,
        page: params?.page,
        pageSize: params?.pageSize,
        ...params?.filters
      }
    });
  }

  async get(id: string): Promise<Asset> {
    return sdkRequest<Asset>({
      method: "GET",
      url: `/assets/${id}`,
    });
  }

  async create(data: Partial<Asset>): Promise<Asset> {
    return sdkRequest<Asset>({
      method: "POST",
      url: "/assets",
      data,
    });
  }

  async update(id: string, data: Partial<Asset>): Promise<Asset> {
    return sdkRequest<Asset>({
      method: "PUT",
      url: `/assets/${id}`,
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    await sdkRequest<any>({
      method: "DELETE",
      url: `/assets/${id}`,
    });
    return true;
  }

  async bulkAction(
    action: "validate" | "create" | "update" | "assign" | "transfer" | "retire" | "qr",
    assetIds?: string[],
    assets?: Partial<Asset>[],
    payload?: any
  ): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: "/assets/bulk",
      data: {
        action,
        assetIds,
        assets,
        payload
      }
    });
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
