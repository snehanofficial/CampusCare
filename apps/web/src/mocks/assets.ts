export interface MockAsset {
  id: string;
  name: string;
  tag: string;
  qrCodeId?: string;
  serialNumber: string;
  model: string;
  status: any;
  lifecycleStage?: any;
  location: string;
  building?: string | null;
  floor?: string | null;
  room?: string | null;
  purchaseDate: string;
  warrantyExpiry: string;
  departmentId: string;
  createdAt: string;
  updatedAt: string;
  assetCode?: string;
}

export const mockAssets: MockAsset[] = [
  {
    id: "a-1",
    name: "ThinkPad L14 Gen 4",
    tag: "CC-LAP-4029",
    serialNumber: "SPF489274",
    model: "Lenovo ThinkPad L14",
    status: "DEPLOYED",
    location: "IT Support Office Room 102",
    purchaseDate: "2025-01-15",
    warrantyExpiry: "2028-01-15",
    departmentId: "d-1",
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "a-2",
    name: "Dell OptiPlex 7000",
    tag: "CC-PC-8902",
    serialNumber: "DELL892748",
    model: "Dell OptiPlex 7090 SFF",
    status: "OPERATIONAL",
    location: "Computer Science Lab 3A",
    purchaseDate: "2024-06-20",
    warrantyExpiry: "2027-06-20",
    departmentId: "d-2",
    createdAt: "2024-06-20T00:00:00Z",
    updatedAt: "2026-06-20T00:00:00Z",
  },
  {
    id: "a-3",
    name: "iPad Air M2 128GB",
    tag: "CC-TAB-9012",
    serialNumber: "DLX8492049",
    model: "Apple iPad Air 5th Gen",
    status: "MAINTENANCE",
    location: "Service Desk Storage Locker B",
    purchaseDate: "2025-03-01",
    warrantyExpiry: "2026-03-01",
    departmentId: "d-1",
    createdAt: "2025-03-01T00:00:00Z",
    updatedAt: "2026-05-10T00:00:00Z",
  },
  {
    id: "a-4",
    name: "HPE ProLiant DL360 Gen10",
    tag: "CC-SRV-0012",
    serialNumber: "HPE908234",
    model: "HP DL360 Rack Server",
    status: "OPERATIONAL",
    location: "Datacenter Rack 2A",
    purchaseDate: "2023-11-10",
    warrantyExpiry: "2026-11-10",
    departmentId: "d-1",
    createdAt: "2023-11-10T00:00:00Z",
    updatedAt: "2026-02-15T00:00:00Z",
  }
];
