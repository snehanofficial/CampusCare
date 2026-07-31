export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  transactionType: "ADD" | "DEDUCT";
  quantity: number;
  referenceId?: string; // e.g. ticketId or assetHistoryId
  notes?: string;
  performedById: string;
  createdAt: Date;
}
