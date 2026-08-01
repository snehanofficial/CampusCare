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
  healthScore?: number;
  prevHealthScore?: number | null;
  healthStatus?: any;
}

export const mockAssets: MockAsset[] = [
  {
    id: "a-1",
    name: "ThinkPad L14 Gen 4",
    tag: "CC-LAP-4029",
    assetCode: "AST-2026-0001",
    serialNumber: "SPF489274",
    model: "Lenovo ThinkPad L14",
    status: "OPERATIONAL",
    lifecycleStage: "IN_USE",
    location: "IT Support Office Room 102",
    building: "Science Hall",
    floor: "1st Floor",
    room: "Room 102",
    purchaseDate: "2025-01-15",
    warrantyExpiry: "2028-01-15",
    departmentId: "d-1",
    healthScore: 85,
    prevHealthScore: 90,
    healthStatus: "HEALTHY",
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "a-2",
    name: "Dell OptiPlex 7000",
    tag: "CC-PC-8902",
    assetCode: "AST-2026-0002",
    serialNumber: "DELL892748",
    model: "Dell OptiPlex 7090 SFF",
    status: "OPERATIONAL",
    lifecycleStage: "ASSIGNED",
    location: "Computer Science Lab 3A Room 301",
    building: "Engineering Building",
    floor: "3rd Floor",
    room: "Room 301",
    purchaseDate: "2024-06-20",
    warrantyExpiry: "2027-06-20",
    departmentId: "d-2",
    healthScore: 95,
    prevHealthScore: 92,
    healthStatus: "HEALTHY",
    createdAt: "2024-06-20T00:00:00Z",
    updatedAt: "2026-06-20T00:00:00Z",
  },
  {
    id: "a-3",
    name: "iPad Air M2 128GB",
    tag: "CC-TAB-9012",
    assetCode: "AST-2026-0003",
    serialNumber: "DLX8492049",
    model: "Apple iPad Air 5th Gen",
    status: "MAINTENANCE",
    lifecycleStage: "MAINTENANCE",
    location: "Science Hall Ground Floor Room G05",
    building: "Science Hall",
    floor: "Ground Floor",
    room: "Room G05",
    purchaseDate: "2025-03-01",
    warrantyExpiry: "2026-03-01",
    departmentId: "d-1",
    healthScore: 30,
    prevHealthScore: 45,
    healthStatus: "WARNING",
    createdAt: "2025-03-01T00:00:00Z",
    updatedAt: "2026-05-10T00:00:00Z",
  },
  {
    id: "a-4",
    name: "HPE ProLiant DL360 Gen10",
    tag: "CC-SRV-0012",
    assetCode: "AST-2026-0004",
    serialNumber: "HPE908234",
    model: "HP DL360 Rack Server",
    status: "OPERATIONAL",
    lifecycleStage: "AVAILABLE",
    location: "Datacenter Rack 2A Room Server Room",
    building: "IT Center",
    floor: "Basement",
    room: "Server Room",
    purchaseDate: "2023-11-10",
    warrantyExpiry: "2026-11-10",
    departmentId: "d-1",
    healthScore: 68,
    prevHealthScore: 68,
    healthStatus: "MONITOR",
    createdAt: "2023-11-10T00:00:00Z",
    updatedAt: "2026-02-15T00:00:00Z",
  },
  {
    id: "a-5",
    name: "MacBook Pro M3",
    tag: "CC-LAP-8821",
    assetCode: "AST-2026-0005",
    serialNumber: "APL9928374",
    model: "Apple MacBook Pro 16",
    status: "BROKEN",
    lifecycleStage: "IN_USE",
    location: "Science Hall 1st Floor Room 102",
    building: "Science Hall",
    floor: "1st Floor",
    room: "Room 102",
    purchaseDate: "2025-09-10",
    warrantyExpiry: "2028-09-10",
    departmentId: "d-2",
    healthScore: 18,
    prevHealthScore: 15,
    healthStatus: "CRITICAL",
    createdAt: "2025-09-10T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
  },
  {
    id: "a-6",
    name: "Cisco Catalyst 9300",
    tag: "CC-SW-1021",
    assetCode: "AST-2026-0006",
    serialNumber: "CSCO887361",
    model: "Cisco 24-Port Switch",
    status: "OPERATIONAL",
    lifecycleStage: "AVAILABLE",
    location: "IT Center Ground Floor Room 101",
    building: "IT Center",
    floor: "Ground Floor",
    room: "Room 101",
    purchaseDate: "2024-03-15",
    warrantyExpiry: "2029-03-15",
    departmentId: "d-1",
    healthScore: 88,
    prevHealthScore: 78,
    healthStatus: "HEALTHY",
    createdAt: "2024-03-15T00:00:00Z",
    updatedAt: "2026-04-10T00:00:00Z",
  }
];
