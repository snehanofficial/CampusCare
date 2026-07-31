import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay, mockInventory } from "../../mocks/index.js";
import type { MockInventoryItem } from "../../mocks/inventory.js";

export interface IInventoryRepository extends IRepository<MockInventoryItem> {
  list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockInventoryItem>>;
}

class MockInventoryRepository implements IInventoryRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockInventoryItem>> {
    let list = [...mockInventory];

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q)
      );
    }

    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          if (key === "lowStock") {
            const isLow = val === "true" || val === true;
            if (isLow) {
              list = list.filter((i) => i.quantity <= i.minQuantity);
            }
          } else {
            list = list.filter((i: any) => String(i[key]) === String(val));
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

  async get(id: string): Promise<MockInventoryItem> {
    const item = mockInventory.find((i) => i.id === id);
    if (!item) throw new Error("Inventory item not found");
    return simulateDelay(item);
  }

  async create(data: Partial<MockInventoryItem>): Promise<MockInventoryItem> {
    const newItem: MockInventoryItem = {
      id: `i-${mockInventory.length + 1}`,
      name: data.name || "New Item",
      sku: data.sku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      quantity: data.quantity !== undefined ? data.quantity : 0,
      minQuantity: data.minQuantity !== undefined ? data.minQuantity : 10,
      unitPrice: data.unitPrice !== undefined ? data.unitPrice : 0.0,
      location: data.location || "Central Storage Room",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockInventory.push(newItem);
    return simulateDelay(newItem);
  }

  async update(id: string, data: Partial<MockInventoryItem>): Promise<MockInventoryItem> {
    const index = mockInventory.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Inventory item not found");
    const updated = {
      ...mockInventory[index]!,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    mockInventory[index] = updated;
    return simulateDelay(updated);
  }

  async delete(id: string): Promise<boolean> {
    const index = mockInventory.findIndex((i) => i.id === id);
    if (index === -1) return simulateDelay(false);
    mockInventory.splice(index, 1);
    return simulateDelay(true);
  }
}

class HttpInventoryRepository implements IInventoryRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockInventoryItem>> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async get(id: string): Promise<MockInventoryItem> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async create(data: Partial<MockInventoryItem>): Promise<MockInventoryItem> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async update(id: string, data: Partial<MockInventoryItem>): Promise<MockInventoryItem> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async delete(id: string): Promise<boolean> {
    throw new Error("HTTP Repository not connected yet.");
  }
}

export const inventoryRepository: IInventoryRepository = new Proxy(
  {} as IInventoryRepository,
  {
    get: (target, prop) => {
      const activeRepo = isMockEnabled() ? new MockInventoryRepository() : new HttpInventoryRepository();
      return Reflect.get(activeRepo, prop);
    },
  }
);
