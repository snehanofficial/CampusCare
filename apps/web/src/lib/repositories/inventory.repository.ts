import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay } from "../../mocks/index.js";
import type {
  InventoryItem,
  InventoryItemWithAvailable,
  InventoryTransaction,
  InventoryAllocation,
  InventoryReservation,
  InventoryDashboardSummary,
  InventoryBulkImportRow,
  InventoryBulkImportResult,
  InventoryListQuery,
  InventoryTransactionListQuery,
  BulkStockOperationPayload,
  BulkStockOperationResult,
  BulkSoftDeletePayload,
  BulkSoftDeleteResult,
} from "@campuscare/shared-types";
import {
  InventoryCategory,
  InventoryStatus,
  InventoryTransactionType,
  AllocationStatus,
  ReservationStatus,
} from "@campuscare/shared-types";
import { sdkRequest } from "../api-sdk.js";
import { apiClient } from "../api-client.js";
import { 
  computeAvailableStock, 
  getStockAlertLevel,
  isLowStock,
  isCriticalStock,
  isOutOfStock
} from "../../features/inventory/utils/inventory-calculations.js";

export interface IInventoryRepository extends IRepository<InventoryItemWithAvailable> {
  list(params?: InventoryListQuery): Promise<RepositoryListResponse<InventoryItemWithAvailable>>;
  get(id: string): Promise<InventoryItemWithAvailable>;
  create(data: any): Promise<InventoryItemWithAvailable>;
  update(id: string, data: any): Promise<InventoryItemWithAvailable>;
  delete(id: string): Promise<boolean>;
  getTransactions(itemId: string, params?: InventoryTransactionListQuery): Promise<RepositoryListResponse<InventoryTransaction>>;
  getAllTransactions(params?: InventoryTransactionListQuery): Promise<RepositoryListResponse<InventoryTransaction>>;
  stockIn(id: string, payload: any): Promise<InventoryItemWithAvailable>;
  stockOut(id: string, payload: any): Promise<InventoryItemWithAvailable>;
  stockAdjust(id: string, payload: any): Promise<InventoryItemWithAvailable>;
  consumeForMaintenance(id: string, payload: any): Promise<any>;
  bulkStockIn(payload: BulkStockOperationPayload): Promise<BulkStockOperationResult>;
  bulkStockOut(payload: BulkStockOperationPayload): Promise<BulkStockOperationResult>;
  bulkStockAdjust(payload: BulkStockOperationPayload): Promise<BulkStockOperationResult>;
  bulkSoftDelete(payload: BulkSoftDeletePayload): Promise<BulkSoftDeleteResult>;
  reserveStock(id: string, payload: any): Promise<any>;
  releaseReservation(reservationId: string, payload: any): Promise<any>;
  listReservations(params?: any): Promise<RepositoryListResponse<InventoryReservation>>;
  getDashboardSummary(): Promise<InventoryDashboardSummary>;
  detectLowStock(): Promise<any>;
  detectCriticalStock(): Promise<any>;
  getAlertSummary(): Promise<any>;
  getStockSnapshot(params?: any): Promise<InventoryItemWithAvailable[]>;
  getStockMovementHistory(params?: any): Promise<RepositoryListResponse<InventoryTransaction>>;
  getLowStockReport(): Promise<any[]>;
  exportCSV(params?: any): Promise<Blob>;
  downloadCSVTemplate(format?: "csv" | "xlsx"): Promise<Blob>;
  validateCSVImport(file: File, mapping?: any): Promise<any>;
  importCommit(items: any[]): Promise<any>;
}

// In-Memory Mock Data
const mockItemsList: InventoryItemWithAvailable[] = [
  {
    id: "item-1",
    itemCode: "INV-2026-0001",
    name: "RJ45 Cat6 Connector",
    description: "Standard ethernet connector plugs",
    category: InventoryCategory.CABLE,
    status: InventoryStatus.ACTIVE,
    unit: "pcs",
    manufacturer: "CableMatters",
    model: "CM-RJ45-100",
    barcodeQr: "CABLE-0001",
    currentStock: 150,
    reservedStock: 10,
    availableStock: 140,
    minimumStock: 20,
    maximumStock: 500,
    reorderLevel: 50,
    unitCost: 0.15,
    location: "IT Storage Shelf A",
    notes: "Main connectivity item",
    isActive: true,
    createdAt: new Date("2026-01-10").toISOString(),
    updatedAt: new Date("2026-01-10").toISOString(),
  },
  {
    id: "item-2",
    itemCode: "INV-2026-0002",
    name: "1TB NVMe SSD",
    description: "Crucial P3 1TB PCIe M.2 2280 SSD",
    category: InventoryCategory.STORAGE,
    status: InventoryStatus.ACTIVE,
    unit: "pcs",
    manufacturer: "Crucial",
    model: "CT1000P3SSD8",
    barcodeQr: "STORE-0002",
    currentStock: 12,
    reservedStock: 2,
    availableStock: 10,
    minimumStock: 5,
    maximumStock: 50,
    reorderLevel: 8,
    unitCost: 65.00,
    location: "IT Storage Safe B",
    notes: "High value replacement disk",
    isActive: true,
    createdAt: new Date("2026-01-12").toISOString(),
    updatedAt: new Date("2026-01-12").toISOString(),
  },
  {
    id: "item-3",
    itemCode: "INV-2026-0003",
    name: "8GB DDR4 RAM SODIMM",
    description: "Laptop RAM upgrades",
    category: InventoryCategory.PERIPHERAL,
    status: InventoryStatus.ACTIVE,
    unit: "pcs",
    manufacturer: "Kingston",
    model: "KVR32S22S8/8",
    barcodeQr: "MEM-0003",
    currentStock: 4,
    reservedStock: 1,
    availableStock: 3,
    minimumStock: 5,
    maximumStock: 40,
    reorderLevel: 10, // Low stock: currentStock (4) <= reorderLevel (10)
    unitCost: 22.50,
    location: "IT Storage Cabinet 1",
    notes: "Common laptop upgrade part",
    isActive: true,
    createdAt: new Date("2026-01-15").toISOString(),
    updatedAt: new Date("2026-01-15").toISOString(),
  },
  {
    id: "item-4",
    itemCode: "INV-2026-0004",
    name: "HDMI Cable 1.8m",
    description: "Standard male-to-male HDMI cable",
    category: InventoryCategory.CABLE,
    status: InventoryStatus.ACTIVE,
    unit: "pcs",
    manufacturer: "AmazonBasics",
    model: "HDMI-18M",
    barcodeQr: "CABLE-0004",
    currentStock: 0, // Out of stock
    reservedStock: 0,
    availableStock: 0,
    minimumStock: 10,
    maximumStock: 100,
    reorderLevel: 20,
    unitCost: 5.99,
    location: "IT Storage Bin C",
    notes: "Needed for all class setups",
    isActive: true,
    createdAt: new Date("2026-01-20").toISOString(),
    updatedAt: new Date("2026-01-20").toISOString(),
  },
  {
    id: "item-5",
    itemCode: "INV-2026-0005",
    name: "Precision Screwdriver Set",
    description: "6-Piece magnetic driver kit",
    category: InventoryCategory.TOOL,
    status: InventoryStatus.ACTIVE,
    unit: "pcs",
    manufacturer: "iFixit",
    model: "IF145-299-4",
    barcodeQr: "TOOL-0005",
    currentStock: 8,
    reservedStock: 0,
    availableStock: 8,
    minimumStock: 2,
    maximumStock: 15,
    reorderLevel: 3,
    unitCost: 19.99,
    location: "Maintenance Room Toolbox",
    notes: "Non-consumable tools",
    isActive: true,
    createdAt: new Date("2026-01-22").toISOString(),
    updatedAt: new Date("2026-01-22").toISOString(),
  },
  {
    id: "item-6",
    itemCode: "INV-2026-0006",
    name: "Cat6 Ethernet Cable (100m roll)",
    description: "UTP solid copper ethernet cable spool",
    category: InventoryCategory.CABLE,
    status: InventoryStatus.ACTIVE,
    unit: "metres",
    manufacturer: "D-Link",
    model: "NCB-C6UGRYR-305",
    barcodeQr: "CABLE-0006",
    currentStock: 300,
    reservedStock: 50,
    availableStock: 250,
    minimumStock: 100,
    maximumStock: 1000,
    reorderLevel: 200,
    unitCost: 0.30,
    location: "IT Storage Floor Block A",
    notes: "Spool cable for wiring runs",
    isActive: true,
    createdAt: new Date("2026-01-25").toISOString(),
    updatedAt: new Date("2026-01-25").toISOString(),
  },
  {
    id: "item-7",
    itemCode: "INV-2026-0007",
    name: "24-Port Gigabit Ethernet Switch",
    description: "Managed rackmount switch",
    category: InventoryCategory.NETWORKING,
    status: InventoryStatus.ACTIVE,
    unit: "pcs",
    manufacturer: "TP-Link",
    model: "TL-SG3428",
    barcodeQr: "NET-0007",
    currentStock: 3,
    reservedStock: 2,
    availableStock: 1, // Critical stock: currentStock (3) <= minimumStock (4)
    minimumStock: 4,
    maximumStock: 10,
    reorderLevel: 5,
    unitCost: 189.99,
    location: "Server Room Shelf 1",
    notes: "Infrastructure backup switches",
    isActive: true,
    createdAt: new Date("2026-01-28").toISOString(),
    updatedAt: new Date("2026-01-28").toISOString(),
  },
  {
    id: "item-8",
    itemCode: "INV-2026-0008",
    name: "650VA Line Interactive UPS",
    description: "Desktop battery backup power supply",
    category: InventoryCategory.POWER,
    status: InventoryStatus.ACTIVE,
    unit: "pcs",
    manufacturer: "APC",
    model: "BX650LI-MS",
    barcodeQr: "POWER-0008",
    currentStock: 2,
    reservedStock: 0,
    availableStock: 2,
    minimumStock: 2, // Critical: currentStock (2) <= minimumStock (2)
    maximumStock: 8,
    reorderLevel: 3,
    unitCost: 79.50,
    location: "Power Room Shelf B",
    notes: "Critical infrastructure backup",
    isActive: true,
    createdAt: new Date("2026-02-01").toISOString(),
    updatedAt: new Date("2026-02-01").toISOString(),
  },
  {
    id: "item-9",
    itemCode: "INV-2026-0009",
    name: "USB-C to HDMI Adapter",
    description: "Adapter plug for standard projectors",
    category: InventoryCategory.PERIPHERAL,
    status: InventoryStatus.INACTIVE,
    unit: "pcs",
    manufacturer: "Anker",
    model: "A8312",
    barcodeQr: "PER-0009",
    currentStock: 15,
    reservedStock: 0,
    availableStock: 15,
    minimumStock: 5,
    maximumStock: 40,
    reorderLevel: 10,
    unitCost: 12.99,
    location: "IT Storage Drawer 3",
    notes: "Temporarily deactivated for swap out",
    isActive: false, // Soft deleted or deactivated
    createdAt: new Date("2026-02-02").toISOString(),
    updatedAt: new Date("2026-02-02").toISOString(),
  },
  {
    id: "item-10",
    itemCode: "INV-2026-0010",
    name: "Replacement Thermal Paste",
    description: "Noctua NT-H1 thermal compound tube",
    category: InventoryCategory.SPARE_PART,
    status: InventoryStatus.ACTIVE,
    unit: "pcs",
    manufacturer: "Noctua",
    model: "NT-H1",
    barcodeQr: "SPARE-0010",
    currentStock: 9,
    reservedStock: 0,
    availableStock: 9,
    minimumStock: 5,
    maximumStock: 30,
    reorderLevel: 8,
    unitCost: 8.90,
    location: "IT Storage Drawer 1",
    notes: "Consumable for CPU repairs",
    isActive: true,
    createdAt: new Date("2026-02-03").toISOString(),
    updatedAt: new Date("2026-02-03").toISOString(),
  }
];

const mockTransactionsList: InventoryTransaction[] = [
  {
    id: "tx-1",
    itemId: "item-1",
    transactionType: InventoryTransactionType.STOCK_IN,
    quantity: 150,
    previousStock: 0,
    newStock: 150,
    performedById: "user-1",
    reason: "Initial import",
    createdAt: new Date("2026-01-10T10:00:00Z").toISOString(),
  },
  {
    id: "tx-2",
    itemId: "item-2",
    transactionType: InventoryTransactionType.STOCK_IN,
    quantity: 12,
    previousStock: 0,
    newStock: 12,
    performedById: "user-1",
    reason: "Procurement order PO-2026-001",
    createdAt: new Date("2026-01-12T11:30:00Z").toISOString(),
  },
  {
    id: "tx-3",
    itemId: "item-3",
    transactionType: InventoryTransactionType.STOCK_OUT,
    quantity: 2,
    previousStock: 6,
    newStock: 4,
    performedById: "user-2",
    reason: "Upgraded laboratory workstations",
    createdAt: new Date("2026-01-20T14:15:00Z").toISOString(),
  }
];

const mockReservationsList: InventoryReservation[] = [
  {
    id: "res-1",
    itemId: "item-1",
    quantity: 10,
    status: ReservationStatus.ACTIVE,
    requestedBy: "user-2",
    moduleRef: "Maintenance",
    referenceId: "rec-1",
    notes: "Ethernet runs for library setup",
    createdAt: new Date("2026-01-25T08:00:00Z").toISOString(),
    updatedAt: new Date("2026-01-25T08:00:00Z").toISOString(),
  },
  {
    id: "res-2",
    itemId: "item-2",
    quantity: 2,
    status: ReservationStatus.ACTIVE,
    requestedBy: "user-2",
    moduleRef: "Maintenance",
    referenceId: "rec-2",
    notes: "Replacements for crash logs",
    createdAt: new Date("2026-01-29T09:10:00Z").toISOString(),
    updatedAt: new Date("2026-01-29T09:10:00Z").toISOString(),
  }
];

class MockInventoryRepository implements IInventoryRepository {
  async list(params?: InventoryListQuery): Promise<RepositoryListResponse<InventoryItemWithAvailable>> {
    let list = mockItemsList.filter((i) => i.isActive);

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.itemCode.toLowerCase().includes(q) ||
          (i.barcodeQr && i.barcodeQr.toLowerCase().includes(q))
      );
    }

    if (params?.category) {
      list = list.filter((i) => i.category === params.category);
    }
    if (params?.status) {
      list = list.filter((i) => i.status === params.status);
    }
    if (params?.isLowStock) {
      list = list.filter((i) => isLowStock(i.currentStock, i.reorderLevel));
    }
    if (params?.isCriticalStock) {
      list = list.filter((i) => isCriticalStock(i.currentStock, i.minimumStock));
    }
    if (params?.isOutOfStock) {
      list = list.filter((i) => isOutOfStock(i.currentStock));
    }
    if (params?.location) {
      const loc = params.location.toLowerCase();
      list = list.filter((i) => i.location?.toLowerCase().includes(loc));
    }
    if (params?.barcodeQr) {
      list = list.filter((i) => i.barcodeQr === params.barcodeQr);
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

  async get(id: string): Promise<InventoryItemWithAvailable> {
    const item = mockItemsList.find((i) => i.id === id);
    if (!item) throw new Error("Inventory item not found");
    return simulateDelay(item);
  }

  async create(data: any): Promise<InventoryItemWithAvailable> {
    const code = `INV-2026-${String(mockItemsList.length + 1).padStart(4, "0")}`;
    const newItem: InventoryItemWithAvailable = {
      id: `item-${mockItemsList.length + 1}`,
      itemCode: code,
      name: data.name,
      description: data.description,
      category: data.category,
      status: data.status || InventoryStatus.ACTIVE,
      unit: data.unit,
      manufacturer: data.manufacturer,
      model: data.model,
      barcodeQr: data.barcodeQr,
      currentStock: data.currentStock || 0,
      reservedStock: 0,
      availableStock: data.currentStock || 0,
      minimumStock: data.minimumStock || 0,
      maximumStock: data.maximumStock,
      reorderLevel: data.reorderLevel,
      unitCost: data.unitCost || null,
      location: data.location || null,
      notes: data.notes || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockItemsList.push(newItem);
    return simulateDelay(newItem);
  }

  async update(id: string, data: any): Promise<InventoryItemWithAvailable> {
    const index = mockItemsList.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Inventory item not found");
    const existing = mockItemsList[index]!;
    const updated: InventoryItemWithAvailable = {
      ...existing,
      ...data,
      availableStock: computeAvailableStock(data.currentStock !== undefined ? data.currentStock : existing.currentStock, existing.reservedStock),
      updatedAt: new Date().toISOString(),
    };
    mockItemsList[index] = updated;
    return simulateDelay(updated);
  }

  async delete(id: string): Promise<boolean> {
    const index = mockItemsList.findIndex((i) => i.id === id);
    if (index === -1) return simulateDelay(false);
    mockItemsList[index]!.isActive = false;
    mockItemsList[index]!.status = InventoryStatus.INACTIVE;
    return simulateDelay(true);
  }

  async getTransactions(itemId: string, params?: InventoryTransactionListQuery): Promise<RepositoryListResponse<InventoryTransaction>> {
    const list = mockTransactionsList.filter((t) => t.itemId === itemId);
    return simulateDelay({
      data: list,
      total: list.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
      pageCount: 1,
    });
  }

  async getAllTransactions(params?: InventoryTransactionListQuery): Promise<RepositoryListResponse<InventoryTransaction>> {
    let list = [...mockTransactionsList];
    if (params?.itemId) list = list.filter((t) => t.itemId === params.itemId);
    if (params?.transactionType) list = list.filter((t) => t.transactionType === params.transactionType);
    return simulateDelay({
      data: list,
      total: list.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
      pageCount: 1,
    });
  }

  async stockIn(id: string, payload: any): Promise<InventoryItemWithAvailable> {
    const item = mockItemsList.find((i) => i.id === id);
    if (!item) throw new Error("Item not found");
    const prev = item.currentStock;
    item.currentStock += payload.quantity;
    item.availableStock = computeAvailableStock(item.currentStock, item.reservedStock);
    mockTransactionsList.push({
      id: `tx-${mockTransactionsList.length + 1}`,
      itemId: id,
      transactionType: InventoryTransactionType.STOCK_IN,
      quantity: payload.quantity,
      previousStock: prev,
      newStock: item.currentStock,
      performedById: "user-1",
      reason: payload.reason,
      notes: payload.notes,
      createdAt: new Date().toISOString(),
    });
    return simulateDelay(item);
  }

  async stockOut(id: string, payload: any): Promise<InventoryItemWithAvailable> {
    const item = mockItemsList.find((i) => i.id === id);
    if (!item) throw new Error("Item not found");
    const available = computeAvailableStock(item.currentStock, item.reservedStock);
    if (available < payload.quantity) throw new Error("Insufficient stock");
    const prev = item.currentStock;
    item.currentStock -= payload.quantity;
    item.availableStock = computeAvailableStock(item.currentStock, item.reservedStock);
    mockTransactionsList.push({
      id: `tx-${mockTransactionsList.length + 1}`,
      itemId: id,
      transactionType: InventoryTransactionType.STOCK_OUT,
      quantity: payload.quantity,
      previousStock: prev,
      newStock: item.currentStock,
      performedById: "user-1",
      reason: payload.reason,
      notes: payload.notes,
      createdAt: new Date().toISOString(),
    });
    return simulateDelay(item);
  }

  async stockAdjust(id: string, payload: any): Promise<InventoryItemWithAvailable> {
    const item = mockItemsList.find((i) => i.id === id);
    if (!item) throw new Error("Item not found");
    if (payload.newQuantity < item.reservedStock) throw new Error("Cannot adjust below reserved");
    const prev = item.currentStock;
    const diff = payload.newQuantity - prev;
    item.currentStock = payload.newQuantity;
    item.availableStock = computeAvailableStock(item.currentStock, item.reservedStock);
    mockTransactionsList.push({
      id: `tx-${mockTransactionsList.length + 1}`,
      itemId: id,
      transactionType: InventoryTransactionType.ADJUSTMENT,
      quantity: Math.abs(diff),
      previousStock: prev,
      newStock: item.currentStock,
      performedById: "user-1",
      reason: payload.reason,
      notes: payload.notes,
      createdAt: new Date().toISOString(),
    });
    return simulateDelay(item);
  }

  async consumeForMaintenance(id: string, payload: any): Promise<any> {
    const item = mockItemsList.find((i) => i.id === id);
    if (!item) throw new Error("Item not found");
    const available = computeAvailableStock(item.currentStock, item.reservedStock);
    if (available < payload.quantity) throw new Error("Insufficient stock");
    const prev = item.currentStock;
    item.currentStock -= payload.quantity;
    item.availableStock = computeAvailableStock(item.currentStock, item.reservedStock);
    mockTransactionsList.push({
      id: `tx-${mockTransactionsList.length + 1}`,
      itemId: id,
      transactionType: InventoryTransactionType.MAINTENANCE_CONSUMPTION,
      quantity: payload.quantity,
      previousStock: prev,
      newStock: item.currentStock,
      performedById: "user-1",
      reason: "Consumed for maintenance",
      notes: payload.notes,
      createdAt: new Date().toISOString(),
    });
    return simulateDelay({ id: `alloc-${Date.now()}` });
  }

  async bulkStockIn(payload: BulkStockOperationPayload): Promise<BulkStockOperationResult> {
    const succeeded: any[] = [];
    const failed: any[] = [];
    for (const op of payload.items) {
      try {
        const item = mockItemsList.find((i) => i.id === op.itemId);
        if (!item) throw new Error("Item not found");
        const prev = item.currentStock;
        item.currentStock += op.quantity || 0;
        item.availableStock = computeAvailableStock(item.currentStock, item.reservedStock);
        succeeded.push({ itemId: op.itemId, newStock: item.currentStock });
        mockTransactionsList.push({
          id: `tx-${mockTransactionsList.length + 1}`,
          itemId: op.itemId,
          transactionType: InventoryTransactionType.STOCK_IN,
          quantity: op.quantity || 0,
          previousStock: prev,
          newStock: item.currentStock,
          performedById: "user-1",
          reason: payload.reason,
          notes: payload.notes,
          createdAt: new Date().toISOString(),
        });
      } catch (err: any) {
        failed.push({ itemId: op.itemId, reason: err.message });
      }
    }
    return simulateDelay({ succeeded, failed });
  }

  async bulkStockOut(payload: BulkStockOperationPayload): Promise<BulkStockOperationResult> {
    const succeeded: any[] = [];
    const failed: any[] = [];
    for (const op of payload.items) {
      try {
        const item = mockItemsList.find((i) => i.id === op.itemId);
        if (!item) throw new Error("Item not found");
        const available = computeAvailableStock(item.currentStock, item.reservedStock);
        if (available < (op.quantity || 0)) throw new Error("Insufficient stock");
        const prev = item.currentStock;
        item.currentStock -= op.quantity || 0;
        item.availableStock = computeAvailableStock(item.currentStock, item.reservedStock);
        succeeded.push({ itemId: op.itemId, newStock: item.currentStock });
        mockTransactionsList.push({
          id: `tx-${mockTransactionsList.length + 1}`,
          itemId: op.itemId,
          transactionType: InventoryTransactionType.STOCK_OUT,
          quantity: op.quantity || 0,
          previousStock: prev,
          newStock: item.currentStock,
          performedById: "user-1",
          reason: payload.reason,
          notes: payload.notes,
          createdAt: new Date().toISOString(),
        });
      } catch (err: any) {
        failed.push({ itemId: op.itemId, reason: err.message });
      }
    }
    return simulateDelay({ succeeded, failed });
  }

  async bulkStockAdjust(payload: BulkStockOperationPayload): Promise<BulkStockOperationResult> {
    const succeeded: any[] = [];
    const failed: any[] = [];
    for (const op of payload.items) {
      try {
        const item = mockItemsList.find((i) => i.id === op.itemId);
        if (!item) throw new Error("Item not found");
        if (op.newQuantity === undefined) throw new Error("Quantity required");
        if (op.newQuantity < item.reservedStock) throw new Error("Cannot adjust below reserved");
        const prev = item.currentStock;
        const diff = op.newQuantity - prev;
        item.currentStock = op.newQuantity;
        item.availableStock = computeAvailableStock(item.currentStock, item.reservedStock);
        succeeded.push({ itemId: op.itemId, newStock: item.currentStock });
        mockTransactionsList.push({
          id: `tx-${mockTransactionsList.length + 1}`,
          itemId: op.itemId,
          transactionType: InventoryTransactionType.ADJUSTMENT,
          quantity: Math.abs(diff),
          previousStock: prev,
          newStock: item.currentStock,
          performedById: "user-1",
          reason: payload.reason,
          notes: payload.notes,
          createdAt: new Date().toISOString(),
        });
      } catch (err: any) {
        failed.push({ itemId: op.itemId, reason: err.message });
      }
    }
    return simulateDelay({ succeeded, failed });
  }

  async bulkSoftDelete(payload: BulkSoftDeletePayload): Promise<BulkSoftDeleteResult> {
    const succeeded: string[] = [];
    const failed: any[] = [];
    for (const id of payload.itemIds) {
      try {
        const item = mockItemsList.find((i) => i.id === id);
        if (!item) throw new Error("Item not found");
        const activeRes = mockReservationsList.filter((r) => r.itemId === id && r.status === ReservationStatus.ACTIVE);
        if (activeRes.length > 0) throw new Error("Active reservations exist");
        item.isActive = false;
        item.status = InventoryStatus.INACTIVE;
        succeeded.push(id);
      } catch (err: any) {
        failed.push({ itemId: id, reason: err.message });
      }
    }
    return simulateDelay({ succeeded, failed });
  }

  async reserveStock(id: string, payload: any): Promise<any> {
    const item = mockItemsList.find((i) => i.id === id);
    if (!item) throw new Error("Item not found");
    const available = computeAvailableStock(item.currentStock, item.reservedStock);
    if (available < payload.quantity) throw new Error("Insufficient available stock");
    item.reservedStock += payload.quantity;
    item.availableStock = computeAvailableStock(item.currentStock, item.reservedStock);
    const reservation: InventoryReservation = {
      id: `res-${mockReservationsList.length + 1}`,
      itemId: id,
      quantity: payload.quantity,
      status: ReservationStatus.ACTIVE,
      requestedBy: "user-1",
      moduleRef: payload.moduleRef || "Manual",
      referenceId: payload.referenceId || null,
      notes: payload.notes || null,
      expiresAt: payload.expiresAt || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockReservationsList.push(reservation);
    return simulateDelay(reservation);
  }

  async releaseReservation(reservationId: string, payload: any): Promise<any> {
    const res = mockReservationsList.find((r) => r.id === reservationId);
    if (!res) throw new Error("Reservation not found");
    if (res.status !== ReservationStatus.ACTIVE) throw new Error("Reservation not active");
    const item = mockItemsList.find((i) => i.id === res.itemId);
    if (item) {
      item.reservedStock = Math.max(0, item.reservedStock - res.quantity);
      item.availableStock = computeAvailableStock(item.currentStock, item.reservedStock);
    }
    res.status = ReservationStatus.RELEASED;
    res.notes = payload.notes || res.notes;
    return simulateDelay(res);
  }

  async listReservations(params?: any): Promise<RepositoryListResponse<InventoryReservation>> {
    let list = [...mockReservationsList];
    if (params?.status) {
      list = list.filter((r) => r.status === params.status);
    }
    return simulateDelay({
      data: list,
      total: list.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
      pageCount: 1,
    });
  }

  async getDashboardSummary(): Promise<InventoryDashboardSummary> {
    const totalItems = mockItemsList.filter((i) => i.isActive).length;
    const activeItems = mockItemsList.filter((i) => i.isActive && i.status === InventoryStatus.ACTIVE).length;
    let lowStockItems = 0;
    let criticalStockItems = 0;
    let outOfStockItems = 0;
    let totalReservedStock = 0;
    let totalAvailableStock = 0;
    let totalInventoryValue = 0;
    
    mockItemsList.filter((i) => i.isActive).forEach((item) => {
      if (isOutOfStock(item.currentStock)) outOfStockItems++;
      else if (isCriticalStock(item.currentStock, item.minimumStock)) criticalStockItems++;
      else if (isLowStock(item.currentStock, item.reorderLevel)) lowStockItems++;
      totalReservedStock += item.reservedStock;
      totalAvailableStock += item.availableStock;
      if (item.unitCost) {
        totalInventoryValue += Number(item.unitCost) * item.currentStock;
      }
    });

    return simulateDelay({
      totalItems,
      activeItems,
      lowStockItems,
      criticalStockItems,
      outOfStockItems,
      totalReservedStock,
      totalAvailableStock,
      totalInventoryValue,
      recentTransactions: mockTransactionsList.slice(0, 10),
    });
  }

  async detectLowStock(): Promise<any> {
    const items = mockItemsList.filter((i) => i.isActive && isLowStock(i.currentStock, i.reorderLevel));
    return simulateDelay({ detectedCount: items.length, items });
  }

  async detectCriticalStock(): Promise<any> {
    const items = mockItemsList.filter((i) => i.isActive && isCriticalStock(i.currentStock, i.minimumStock));
    return simulateDelay({ detectedCount: items.length, items });
  }

  async getAlertSummary(): Promise<any> {
    let lowCount = 0;
    let criticalCount = 0;
    let outOfStockCount = 0;
    mockItemsList.filter((i) => i.isActive).forEach((i) => {
      if (isOutOfStock(i.currentStock)) outOfStockCount++;
      else if (isCriticalStock(i.currentStock, i.minimumStock)) criticalCount++;
      else if (isLowStock(i.currentStock, i.reorderLevel)) lowCount++;
    });
    return simulateDelay({ lowCount, criticalCount, outOfStockCount });
  }

  async getStockSnapshot(params?: any): Promise<InventoryItemWithAvailable[]> {
    return simulateDelay(mockItemsList.filter((i) => i.isActive));
  }

  async getStockMovementHistory(params?: any): Promise<RepositoryListResponse<InventoryTransaction>> {
    return simulateDelay({
      data: mockTransactionsList,
      total: mockTransactionsList.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
      pageCount: 1,
    });
  }

  async getLowStockReport(): Promise<any[]> {
    const list = mockItemsList.filter((i) => i.isActive && (isLowStock(i.currentStock, i.reorderLevel) || isCriticalStock(i.currentStock, i.minimumStock) || isOutOfStock(i.currentStock)));
    return simulateDelay(list.map((i) => ({ ...i, alertLevel: getStockAlertLevel(i) })));
  }

  async exportCSV(params?: any): Promise<Blob> {
    const headers = "ID,Item Code,Name,Category,Status,Unit,Current Stock,Reserved Stock,Available Stock,Min Stock,Max Stock,Reorder Level,Unit Cost,Location\n";
    const dataRows = mockItemsList.filter(i => i.isActive).map(item => 
      `${item.id},${item.itemCode},"${item.name}",${item.category},${item.status},${item.unit},${item.currentStock},${item.reservedStock},${item.availableStock},${item.minimumStock},${item.maximumStock},${item.reorderLevel},${item.unitCost || ""},"${item.location || ""}"`
    ).join("\n");
    return simulateDelay(new Blob([headers + dataRows], { type: "text/csv" }));
  }

  async downloadCSVTemplate(format?: "csv" | "xlsx"): Promise<Blob> {
    const headers = "name,category,unit,manufacturer,model,barcodeQr,currentStock,minimumStock,maximumStock,reorderLevel,unitCost,location,notes\n";
    return simulateDelay(new Blob([headers], { type: "text/csv" }));
  }

  async validateCSVImport(file: File, mapping?: any): Promise<any> {
    return simulateDelay({
      totalRows: 5,
      successCount: 4,
      failureCount: 1,
      errors: [
        { row: 2, field: "name", value: "", message: "Name is required" }
      ],
      validData: [
        { name: "Mock Imported Cable", category: "CABLE", unit: "METERS", currentStock: 100, minimumStock: 10, maximumStock: 500, reorderLevel: 20, unitCost: 1.5, location: "Bin A1" }
      ]
    });
  }

  async importCommit(items: any[]): Promise<any> {
    items.forEach(i => {
      mockItemsList.push({
        id: `mock-inv-${Math.floor(Math.random() * 10000)}`,
        itemCode: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        name: i.name,
        description: i.description || null,
        category: i.category,
        status: i.status || "ACTIVE",
        unit: i.unit,
        manufacturer: i.manufacturer || null,
        model: i.model || null,
        barcodeQr: i.barcodeQr || null,
        currentStock: i.currentStock || 0,
        reservedStock: 0,
        availableStock: i.currentStock || 0,
        minimumStock: i.minimumStock || 0,
        maximumStock: i.maximumStock || 0,
        reorderLevel: i.reorderLevel || 0,
        unitCost: i.unitCost || null,
        location: i.location || null,
        notes: i.notes || null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
    return simulateDelay({ success: true, count: items.length });
  }
}

class ApiInventoryRepository implements IInventoryRepository {
  async list(params?: InventoryListQuery): Promise<RepositoryListResponse<InventoryItemWithAvailable>> {
    return sdkRequest<RepositoryListResponse<InventoryItemWithAvailable>>({
      method: "GET",
      url: "/inventory",
      params,
    });
  }

  async get(id: string): Promise<InventoryItemWithAvailable> {
    return sdkRequest<InventoryItemWithAvailable>({
      method: "GET",
      url: `/inventory/${id}`,
    });
  }

  async create(data: any): Promise<InventoryItemWithAvailable> {
    return sdkRequest<InventoryItemWithAvailable>({
      method: "POST",
      url: "/inventory",
      data,
    });
  }

  async update(id: string, data: any): Promise<InventoryItemWithAvailable> {
    return sdkRequest<InventoryItemWithAvailable>({
      method: "PUT",
      url: `/inventory/${id}`,
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    return sdkRequest<boolean>({
      method: "DELETE",
      url: `/inventory/${id}`,
    });
  }

  async getTransactions(itemId: string, params?: InventoryTransactionListQuery): Promise<RepositoryListResponse<InventoryTransaction>> {
    return sdkRequest<RepositoryListResponse<InventoryTransaction>>({
      method: "GET",
      url: `/inventory/${itemId}/transactions`,
      params,
    });
  }

  async getAllTransactions(params?: InventoryTransactionListQuery): Promise<RepositoryListResponse<InventoryTransaction>> {
    return sdkRequest<RepositoryListResponse<InventoryTransaction>>({
      method: "GET",
      url: "/inventory/transactions",
      params,
    });
  }

  async stockIn(id: string, payload: any): Promise<InventoryItemWithAvailable> {
    return sdkRequest<InventoryItemWithAvailable>({
      method: "POST",
      url: `/inventory/${id}/stock-in`,
      data: payload,
    });
  }

  async stockOut(id: string, payload: any): Promise<InventoryItemWithAvailable> {
    return sdkRequest<InventoryItemWithAvailable>({
      method: "POST",
      url: `/inventory/${id}/stock-out`,
      data: payload,
    });
  }

  async stockAdjust(id: string, payload: any): Promise<InventoryItemWithAvailable> {
    return sdkRequest<InventoryItemWithAvailable>({
      method: "POST",
      url: `/inventory/${id}/stock-adjust`,
      data: payload,
    });
  }

  async consumeForMaintenance(id: string, payload: any): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: `/inventory/${id}/consume`,
      data: payload,
    });
  }

  async bulkStockIn(payload: BulkStockOperationPayload): Promise<BulkStockOperationResult> {
    return sdkRequest<BulkStockOperationResult>({
      method: "POST",
      url: "/inventory/bulk/stock-in",
      data: payload,
    });
  }

  async bulkStockOut(payload: BulkStockOperationPayload): Promise<BulkStockOperationResult> {
    return sdkRequest<BulkStockOperationResult>({
      method: "POST",
      url: "/inventory/bulk/stock-out",
      data: payload,
    });
  }

  async bulkStockAdjust(payload: BulkStockOperationPayload): Promise<BulkStockOperationResult> {
    return sdkRequest<BulkStockOperationResult>({
      method: "POST",
      url: "/inventory/bulk/stock-adjust",
      data: payload,
    });
  }

  async bulkSoftDelete(payload: BulkSoftDeletePayload): Promise<BulkSoftDeleteResult> {
    return sdkRequest<BulkSoftDeleteResult>({
      method: "POST",
      url: "/inventory/bulk/soft-delete",
      data: payload,
    });
  }

  async reserveStock(id: string, payload: any): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: `/inventory/${id}/reserve`,
      data: payload,
    });
  }

  async releaseReservation(reservationId: string, payload: any): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: `/inventory/reservations/${reservationId}/release`,
      data: payload,
    });
  }

  async listReservations(params?: any): Promise<RepositoryListResponse<InventoryReservation>> {
    return sdkRequest<RepositoryListResponse<InventoryReservation>>({
      method: "GET",
      url: "/inventory/reservations",
      params,
    });
  }

  async getDashboardSummary(): Promise<InventoryDashboardSummary> {
    return sdkRequest<InventoryDashboardSummary>({
      method: "GET",
      url: "/inventory/dashboard/summary",
    });
  }

  async detectLowStock(): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: "/inventory/automation/detect-low-stock",
    });
  }

  async detectCriticalStock(): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: "/inventory/automation/detect-critical-stock",
    });
  }

  async getAlertSummary(): Promise<any> {
    return sdkRequest<any>({
      method: "GET",
      url: "/inventory/alerts/summary",
    });
  }

  async getStockSnapshot(params?: any): Promise<InventoryItemWithAvailable[]> {
    const res = await sdkRequest<any>({
      method: "GET",
      url: "/inventory/reports/snapshot",
      params,
    });
    return res.data || res;
  }

  async getStockMovementHistory(params?: any): Promise<RepositoryListResponse<InventoryTransaction>> {
    return sdkRequest<RepositoryListResponse<InventoryTransaction>>({
      method: "GET",
      url: "/inventory/reports/movement",
      params,
    });
  }

  async getLowStockReport(): Promise<any[]> {
    return sdkRequest<any[]>({
      method: "GET",
      url: "/inventory/reports/low-stock",
    });
  }

  async exportCSV(params?: any): Promise<Blob> {
    const response = await apiClient.get<Blob>("/inventory/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  }

  async downloadCSVTemplate(format: "csv" | "xlsx" = "csv"): Promise<Blob> {
    const response = await apiClient.get<Blob>("/inventory/import/template", {
      params: { format },
      responseType: "blob",
    });
    return response.data;
  }

  async validateCSVImport(file: File, mapping?: any): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    if (mapping) {
      formData.append("mapping", JSON.stringify(mapping));
    }
    const response = await apiClient.post<{ data: any }>("/inventory/import/validate", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data?.data;
  }

  async importCommit(items: any[]): Promise<any> {
    const response = await apiClient.post<any>("/inventory/import/commit", { items });
    return response.data?.data;
  }
}

export const inventoryRepository: IInventoryRepository = new Proxy(
  {} as IInventoryRepository,
  {
    get: (target, prop) => {
      const activeRepo = isMockEnabled()
        ? new MockInventoryRepository()
        : new ApiInventoryRepository();
      return Reflect.get(activeRepo, prop);
    },
  }
);

export default inventoryRepository;
