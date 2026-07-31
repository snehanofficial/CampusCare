import type { AuthUser, Session } from "@campuscare/shared-types";

// Dynamic toggle for using mock data instead of calling active APIs
const MOCK_STORAGE_KEY = "campuscare-use-mocks";

export function isMockEnabled(): boolean {
  const envVal = import.meta.env.VITE_USE_MOCKS;
  const localVal = localStorage.getItem(MOCK_STORAGE_KEY);
  if (localVal !== null) {
    return localVal === "true";
  }
  return envVal === "true" || envVal === true;
}

export function setMockEnabled(enabled: boolean): void {
  localStorage.setItem(MOCK_STORAGE_KEY, enabled ? "true" : "false");
  window.dispatchEvent(new Event("mocks:state-changed"));
}

// ---------------------------------------------------------
// Realistic Mock Database
// ---------------------------------------------------------

export const mockUsers = [
  { id: "u-1", email: "admin@campuscare.edu", firstName: "Alex", lastName: "Admin", role: "ADMIN", departmentId: "d-1" },
  { id: "u-2", email: "tech@campuscare.edu", firstName: "Sarah", lastName: "Technician", role: "TECHNICIAN", departmentId: "d-1" },
  { id: "u-3", email: "student@campuscare.edu", firstName: "John", lastName: "Student", role: "STUDENT", departmentId: "d-2" },
  { id: "u-4", email: "jane@campuscare.edu", firstName: "Jane", lastName: "Doe", role: "STUDENT", departmentId: "d-3" },
];

export const mockDepartments = [
  { id: "d-1", name: "Information Technology", code: "IT", description: "Central IT and Support Service Department" },
  { id: "d-2", name: "Computer Science", code: "CS", description: "Department of Computer Science" },
  { id: "d-3", name: "Mechanical Engineering", code: "ME", description: "Department of Mechanical Engineering" },
];

export const mockTickets = [
  {
    id: "t-1",
    ticketNumber: "INC-1029",
    title: "Wi-Fi connectivity dropped in Library 2nd Floor",
    description: "Students are reporting constant authentication errors when connecting to Campus-Secure Wi-Fi. AP seems to reject new associations.",
    status: "OPEN",
    priority: "CRITICAL",
    creatorId: "u-3",
    assigneeId: undefined,
    categoryId: "cat-1",
    departmentId: "d-1",
    createdAt: new Date("2026-07-30T10:00:00Z"),
    updatedAt: new Date("2026-07-30T10:00:00Z"),
  },
  {
    id: "t-2",
    ticketNumber: "INC-1030",
    title: "Software license activation issue on Lab PC #12",
    description: "MATLAB software license expired and needs verification under campus academic bundle.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    creatorId: "u-4",
    assigneeId: "u-2",
    categoryId: "cat-2",
    departmentId: "d-1",
    createdAt: new Date("2026-07-30T14:30:00Z"),
    updatedAt: new Date("2026-07-31T09:00:00Z"),
  },
  {
    id: "t-3",
    ticketNumber: "INC-1031",
    title: "Broken projector in Seminar Hall B",
    description: "The ceiling mounted EPSON projector does not turn on. Status indicator flashing amber. Needs technician evaluation.",
    status: "ASSIGNED",
    priority: "HIGH",
    creatorId: "u-1",
    assigneeId: "u-2",
    categoryId: "cat-3",
    departmentId: "d-1",
    createdAt: new Date("2026-07-31T08:15:00Z"),
    updatedAt: new Date("2026-07-31T08:30:00Z"),
  },
  {
    id: "t-4",
    ticketNumber: "INC-1032",
    title: "Reset password support for SIS student portal",
    description: "Locked out of my Student Information System account. Need a temporary security key to restore authentication.",
    status: "RESOLVED",
    priority: "LOW",
    creatorId: "u-3",
    assigneeId: "u-2",
    categoryId: "cat-4",
    departmentId: "d-1",
    createdAt: new Date("2026-07-29T11:00:00Z"),
    updatedAt: new Date("2026-07-29T16:00:00Z"),
    resolvedAt: new Date("2026-07-29T16:00:00Z"),
  },
];

export const mockAssets = [
  { id: "a-1", name: "ThinkPad L14 Gen 4", tag: "CC-LAP-4029", serialNumber: "SPF489274", model: "Lenovo ThinkPad L14", status: "DEPLOYED", location: "IT Support Office Room 102", purchaseDate: new Date("2025-01-15"), warrantyExpiry: new Date("2028-01-15"), departmentId: "d-1", createdAt: new Date("2025-01-15"), updatedAt: new Date("2026-01-15") },
  { id: "a-2", name: "Dell OptiPlex 7000", tag: "CC-PC-8902", serialNumber: "DELL892748", model: "Dell OptiPlex 7090 SFF", status: "OPERATIONAL", location: "Computer Science Lab 3A", purchaseDate: new Date("2024-06-20"), warrantyExpiry: new Date("2027-06-20"), departmentId: "d-2", createdAt: new Date("2024-06-20"), updatedAt: new Date("2026-06-20") },
  { id: "a-3", name: "iPad Air M2 128GB", tag: "CC-TAB-9012", serialNumber: "DLX8492049", model: "Apple iPad Air 5th Gen", status: "MAINTENANCE", location: "Service Desk Storage Locker B", purchaseDate: new Date("2025-03-01"), warrantyExpiry: new Date("2026-03-01"), departmentId: "d-1", createdAt: new Date("2025-03-01"), updatedAt: new Date("2026-05-10") },
];

export const mockInventory = [
  { id: "i-1", name: "Cat6 Ethernet Cable 3m", sku: "SKU-CAT6-3M", quantity: 150, minQuantity: 50, unitPrice: 4.99, location: "IT Central Storage Shelf A4", createdAt: new Date(), updatedAt: new Date() },
  { id: "i-2", name: "HDMI Cable 5m", sku: "SKU-HDMI-5M", quantity: 45, minQuantity: 15, unitPrice: 9.99, location: "IT Central Storage Shelf A8", createdAt: new Date(), updatedAt: new Date() },
  { id: "i-3", name: "Crucial MX500 SSD 500GB", sku: "SKU-SSD-CRUCIAL-500", quantity: 12, minQuantity: 10, unitPrice: 49.99, location: "Locker Room Cabinet C2", createdAt: new Date(), updatedAt: new Date() },
  { id: "i-4", name: "USB-C Multiport Adapter Hub", sku: "SKU-HUB-USBC-6IN1", quantity: 8, minQuantity: 15, unitPrice: 29.99, location: "IT Central Storage Shelf B1", createdAt: new Date(), updatedAt: new Date() },
];

export const mockAuditLogs = [
  { id: "l-1", timestamp: new Date("2026-07-31T17:30:00Z"), action: "USER_LOGIN", details: "User admin@campuscare.edu logged in successfully from IP 192.168.1.52", performedBy: "Alex Admin", severity: "INFO" },
  { id: "l-2", timestamp: new Date("2026-07-31T17:45:00Z"), action: "SESSION_REVOKED", details: "Session 489c-a812 revoked manually from devices panel", performedBy: "Alex Admin", severity: "WARN" },
  { id: "l-3", timestamp: new Date("2026-07-31T18:00:00Z"), action: "ASSET_UPDATE", details: "Asset tag #CC-LAP-4029 location updated to Room 102", performedBy: "Sarah Technician", severity: "INFO" },
];

export let mockSessions: Session[] = [
  {
    id: "s-1",
    userId: "u-1",
    deviceName: "Workstation Desktop",
    deviceType: "desktop",
    browser: "Chrome 125.0.0",
    os: "Windows 11 Professional",
    ipAddress: "192.168.1.52",
    lastActivity: new Date("2026-07-31T18:30:00Z").toISOString(),
    expiresAt: new Date("2026-08-07T18:30:00Z").toISOString(),
    createdAt: new Date("2026-07-31T11:00:00Z").toISOString(),
  },
  {
    id: "s-2",
    userId: "u-1",
    deviceName: "Personal Phone",
    deviceType: "mobile",
    browser: "Safari Mobile 17.4",
    os: "iOS 17.4.1",
    ipAddress: "172.56.24.12",
    lastActivity: new Date("2026-07-31T16:15:00Z").toISOString(),
    expiresAt: new Date("2026-08-07T16:15:00Z").toISOString(),
    createdAt: new Date("2026-07-31T15:00:00Z").toISOString(),
  },
];

// ---------------------------------------------------------
// Mock Delay Helper
// ---------------------------------------------------------
export const simulateDelay = <T>(result: T, durationMs = 450): Promise<T> => {
  return new Promise((resolve) => setTimeout(() => resolve(result), durationMs));
};

// ---------------------------------------------------------
// Mock API Adapters
// ---------------------------------------------------------
export const mockAdapters = {
  auth: {
    getMe: async (): Promise<AuthUser> => {
      const activeUser = mockUsers[0]!; // Default to Alex Admin for mock session
      return simulateDelay({
        id: activeUser.id,
        email: activeUser.email,
        firstName: activeUser.firstName,
        lastName: activeUser.lastName,
        role: activeUser.role,
        permissions: [
          "tickets:create",
          "tickets:read_own",
          "tickets:read_all",
          "tickets:update_own",
          "tickets:update_all",
          "tickets:assign",
          "tickets:resolve",
          "tickets:delete",
          "assets:create",
          "assets:read",
          "assets:update",
          "assets:delete",
          "inventory:read",
          "inventory:manage",
          "users:read",
          "users:manage",
          "departments:manage",
          "categories:manage",
          "reports:view",
          "sla:manage",
          "audit:read",
          "settings:manage",
          "notifications:send",
          "knowledge-base:manage",
        ],
        avatarUrl: null,
      });
    },
    getSessions: async (): Promise<Session[]> => {
      return simulateDelay([...mockSessions]);
    },
    revokeSession: async (id: string): Promise<void> => {
      mockSessions = mockSessions.filter((s) => s.id !== id);
      return simulateDelay(undefined);
    },
    logoutAll: async (): Promise<void> => {
      mockSessions = [];
      return simulateDelay(undefined);
    },
  },
};
