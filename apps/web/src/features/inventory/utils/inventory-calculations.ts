export function computeAvailableStock(currentStock: number, reservedStock: number): number {
  return Math.max(0, currentStock - reservedStock);
}

export function isLowStock(currentStock: number, reorderLevel: number): boolean {
  return currentStock <= reorderLevel && currentStock > 0;
}

export function isCriticalStock(currentStock: number, minimumStock: number): boolean {
  return currentStock <= minimumStock && currentStock > 0;
}

export function isOutOfStock(currentStock: number): boolean {
  return currentStock <= 0;
}

export function getStockAlertLevel(item: { currentStock: number; minimumStock: number; reorderLevel: number }): "OUT_OF_STOCK" | "CRITICAL" | "LOW" | "OK" {
  if (isOutOfStock(item.currentStock)) return "OUT_OF_STOCK";
  if (isCriticalStock(item.currentStock, item.minimumStock)) return "CRITICAL";
  if (isLowStock(item.currentStock, item.reorderLevel)) return "LOW";
  return "OK";
}

export function computeInventoryValue(currentStock: number, unitCost?: string | number | null): number | null {
  if (!unitCost) return null;
  return currentStock * Number(unitCost);
}
