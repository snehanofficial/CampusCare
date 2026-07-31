export interface Asset {
  id: string;
  name: string;
  tag: string; // QR code identifier
  serialNumber?: string;
  model: string;
  status: string;
  location: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  departmentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetHistory {
  id: string;
  assetId: string;
  actionType: string; // e.g. "MAINTENANCE", "STATUS_CHANGE", "ASSIGNMENT"
  notes: string;
  performedById: string;
  createdAt: Date;
}
