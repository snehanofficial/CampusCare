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

  // Phase 2 Procurement
  listProcurements(params?: RepositoryQueryParams): Promise<RepositoryListResponse<any>>;
  getProcurement(id: string): Promise<any>;
  createProcurement(data: any): Promise<any>;
  updateProcurement(id: string, data: any): Promise<any>;
  deleteProcurement(id: string): Promise<any>;
  registerProcurementAssets(id: string, payload: { assets: any[] }): Promise<any>;

  // Phase 2 Assignment / Lifecycle
  assignAsset(id: string, payload: any): Promise<any>;
  returnAsset(id: string, payload: any): Promise<any>;
  transferAsset(id: string, payload: any): Promise<any>;
  changeAssetLifecycle(id: string, payload: any): Promise<any>;
}

// In-memory mock procurements list
const mockProcurementsList = [
  {
    id: "p-1",
    requestNumber: "PR-2026-0001",
    purchaseOrderNumber: "PO-2026-1021",
    invoiceNumber: "INV-8820",
    purchaseDate: "2026-07-28",
    purchaseCost: 2400.00,
    vendorReference: "Dell Inc.",
    status: "REGISTERED",
    assetName: "Dell Latitude 5440",
    model: "Latitude 5440",
    manufacturer: "Dell",
    categoryId: "cat-3",
    departmentId: "d-1",
    quantity: 3,
    registeredCount: 3,
    createdAt: "2026-07-27T10:00:00Z",
    updatedAt: "2026-07-28T12:00:00Z",
  },
  {
    id: "p-2",
    requestNumber: "PR-2026-0002",
    purchaseOrderNumber: "PO-2026-1022",
    invoiceNumber: null,
    purchaseDate: null,
    purchaseCost: 950.00,
    vendorReference: "Logitech",
    status: "ORDERED",
    assetName: "Logitech MX Master 3S",
    model: "MX Master 3S",
    manufacturer: "Logitech",
    categoryId: "cat-3",
    departmentId: "d-2",
    quantity: 10,
    registeredCount: 0,
    createdAt: "2026-07-30T14:30:00Z",
    updatedAt: "2026-07-30T14:30:00Z",
  }
];

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
    
    // Ensure history array exists on mock detail retrieval
    const detailItem = { ...item } as any;
    if (!detailItem.history) {
      detailItem.history = [
        {
          id: "hist-1",
          assetId: id,
          actionType: "CREATED",
          notes: "Asset registered in database with sequential code.",
          createdAt: item.createdAt,
          performedBy: { firstName: "System", lastName: "Agent", email: "admin@campuscare.edu" }
        }
      ];
    }
    return simulateDelay(detailItem);
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

  // Phase 2 Mock Procurement Implementations
  async listProcurements(params?: RepositoryQueryParams): Promise<RepositoryListResponse<any>> {
    let list = [...mockProcurementsList];
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.requestNumber.toLowerCase().includes(q) ||
          p.assetName.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q)
      );
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

  async getProcurement(id: string): Promise<any> {
    const item = mockProcurementsList.find((p) => p.id === id);
    if (!item) throw new Error("Procurement request not found");
    return simulateDelay(item);
  }

  async createProcurement(data: any): Promise<any> {
    const currentYear = new Date().getFullYear();
    const newPR = {
      id: `p-${mockProcurementsList.length + 1}`,
      requestNumber: `PR-${currentYear}-000${mockProcurementsList.length + 1}`,
      purchaseOrderNumber: data.purchaseOrderNumber || null,
      invoiceNumber: data.invoiceNumber || null,
      purchaseDate: data.purchaseDate || null,
      purchaseCost: data.purchaseCost || 0.00,
      vendorReference: data.vendorReference || null,
      status: "REQUESTED",
      assetName: data.assetName || "Unspecified Asset",
      model: data.model || "Generic Model",
      manufacturer: data.manufacturer || null,
      categoryId: data.categoryId || null,
      departmentId: data.departmentId || "d-1",
      quantity: data.quantity || 1,
      registeredCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockProcurementsList.push(newPR);
    return simulateDelay(newPR);
  }

  async updateProcurement(id: string, data: any): Promise<any> {
    const idx = mockProcurementsList.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Procurement request not found");
    const updated = {
      ...mockProcurementsList[idx]!,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    mockProcurementsList[idx] = updated;
    return simulateDelay(updated);
  }

  async deleteProcurement(id: string): Promise<any> {
    const idx = mockProcurementsList.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Procurement request not found");
    mockProcurementsList.splice(idx, 1);
    return simulateDelay({ success: true });
  }

  async registerProcurementAssets(id: string, payload: { assets: any[] }): Promise<any> {
    const pr = mockProcurementsList.find((p) => p.id === id);
    if (!pr) throw new Error("Procurement request not found");

    const count = payload.assets.length;
    pr.registeredCount += count;
    if (pr.registeredCount >= pr.quantity) {
      pr.status = "REGISTERED";
    } else {
      pr.status = "RECEIVED";
    }

    const createdList = [];
    for (let i = 0; i < count; i++) {
      const payloadAsset = payload.assets[i];
      const newAsset = await this.create({
        name: pr.assetName,
        model: pr.model,
        manufacturer: pr.manufacturer,
        categoryId: pr.categoryId,
        departmentId: pr.departmentId,
        serialNumber: payloadAsset?.serialNumber || `SN-PR-${Math.floor(100000 + Math.random() * 900000)}`,
        tag: payloadAsset?.tag || `CC-TAG-${Math.floor(100000 + Math.random() * 900000)}`,
        location: payloadAsset?.location || "Central Storage",
        lifecycleStage: "AVAILABLE" as any,
      });
      createdList.push(newAsset);
    }
    return simulateDelay(createdList);
  }

  // Phase 2 Mock Assignment/Lifecycle methods
  async assignAsset(id: string, payload: any): Promise<any> {
    const asset = mockAssets.find((a) => a.id === id);
    if (!asset) throw new Error("Asset not found");
    asset.lifecycleStage = "ASSIGNED";
    asset.updatedAt = new Date().toISOString();
    return simulateDelay(asset);
  }

  async returnAsset(id: string, payload: any): Promise<any> {
    const asset = mockAssets.find((a) => a.id === id);
    if (!asset) throw new Error("Asset not found");
    asset.lifecycleStage = "AVAILABLE";
    asset.updatedAt = new Date().toISOString();
    return simulateDelay(asset);
  }

  async transferAsset(id: string, payload: any): Promise<any> {
    const asset = mockAssets.find((a) => a.id === id);
    if (!asset) throw new Error("Asset not found");
    asset.lifecycleStage = "ASSIGNED";
    if (payload.transferType === "DEPARTMENT") {
      asset.departmentId = payload.departmentId;
    } else if (payload.transferType === "LOCATION") {
      asset.location = payload.location;
      asset.building = payload.building || asset.building;
      asset.floor = payload.floor || asset.floor;
      asset.room = payload.room || asset.room;
    }
    asset.updatedAt = new Date().toISOString();
    return simulateDelay(asset);
  }

  async changeAssetLifecycle(id: string, payload: any): Promise<any> {
    const asset = mockAssets.find((a) => a.id === id);
    if (!asset) throw new Error("Asset not found");
    asset.lifecycleStage = payload.lifecycleStage;
    if (payload.lifecycleStage === "RETIRED" || payload.lifecycleStage === "DISPOSED") {
      asset.status = "DECOMMISSIONED";
    }
    asset.updatedAt = new Date().toISOString();
    return simulateDelay(asset);
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

  // Phase 2 Http Procurement endpoints
  async listProcurements(params?: RepositoryQueryParams): Promise<RepositoryListResponse<any>> {
    return sdkRequest<RepositoryListResponse<any>>({
      method: "GET",
      url: "/assets/procurements",
      params: {
        search: params?.search,
        page: params?.page,
        pageSize: params?.pageSize,
        ...params?.filters
      }
    });
  }

  async getProcurement(id: string): Promise<any> {
    return sdkRequest<any>({
      method: "GET",
      url: `/assets/procurements/${id}`,
    });
  }

  async createProcurement(data: any): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: "/assets/procurements",
      data,
    });
  }

  async updateProcurement(id: string, data: any): Promise<any> {
    return sdkRequest<any>({
      method: "PUT",
      url: `/assets/procurements/${id}`,
      data,
    });
  }

  async deleteProcurement(id: string): Promise<any> {
    return sdkRequest<any>({
      method: "DELETE",
      url: `/assets/procurements/${id}`,
    });
  }

  async registerProcurementAssets(id: string, payload: { assets: any[] }): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: `/assets/procurements/${id}/register`,
      data: payload,
    });
  }

  // Phase 2 Http Assignment/Lifecycle endpoints
  async assignAsset(id: string, payload: any): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: `/assets/${id}/assign`,
      data: payload,
    });
  }

  async returnAsset(id: string, payload: any): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: `/assets/${id}/return`,
      data: payload,
    });
  }

  async transferAsset(id: string, payload: any): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: `/assets/${id}/transfer`,
      data: payload,
    });
  }

  async changeAssetLifecycle(id: string, payload: any): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: `/assets/${id}/lifecycle`,
      data: payload,
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
