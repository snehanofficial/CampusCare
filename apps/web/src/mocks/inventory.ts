export interface MockInventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export const mockInventory: MockInventoryItem[] = [
  {
    id: "i-1",
    name: "Cat6 Ethernet Cable 3m",
    sku: "SKU-CAT6-3M",
    quantity: 150,
    minQuantity: 50,
    unitPrice: 4.99,
    location: "IT Central Storage Shelf A4",
    createdAt: "2025-01-10T00:00:00Z",
    updatedAt: "2026-07-31T00:00:00Z",
  },
  {
    id: "i-2",
    name: "HDMI Cable 5m",
    sku: "SKU-HDMI-5M",
    quantity: 45,
    minQuantity: 15,
    unitPrice: 9.99,
    location: "IT Central Storage Shelf A8",
    createdAt: "2025-01-10T00:00:00Z",
    updatedAt: "2026-07-31T00:00:00Z",
  },
  {
    id: "i-3",
    name: "Crucial MX500 SSD 500GB",
    sku: "SKU-SSD-CRUCIAL-500",
    quantity: 12,
    minQuantity: 10,
    unitPrice: 49.99,
    location: "Locker Room Cabinet C2",
    createdAt: "2025-02-12T00:00:00Z",
    updatedAt: "2026-07-30T00:00:00Z",
  },
  {
    id: "i-4",
    name: "USB-C Multiport Adapter Hub",
    sku: "SKU-HUB-USBC-6IN1",
    quantity: 8,
    minQuantity: 15,
    unitPrice: 29.99,
    location: "IT Central Storage Shelf B1",
    createdAt: "2025-05-18T00:00:00Z",
    updatedAt: "2026-07-29T00:00:00Z",
  },
  {
    id: "i-5",
    name: "Logitech Pebble Wireless Mouse",
    sku: "SKU-MSE-LOGI-PEB",
    quantity: 4,
    minQuantity: 20,
    unitPrice: 24.99,
    location: "IT Central Storage Cabinet D3",
    createdAt: "2025-06-01T00:00:00Z",
    updatedAt: "2026-07-31T00:00:00Z",
  }
];
