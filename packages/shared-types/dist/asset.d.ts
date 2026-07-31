export interface Asset {
    id: string;
    name: string;
    tag: string;
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
    actionType: string;
    notes: string;
    performedById: string;
    createdAt: Date;
}
//# sourceMappingURL=asset.d.ts.map