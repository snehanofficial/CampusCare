import type { AuthUser, Session } from "@campuscare/shared-types";
import { mockUsers } from "./users.js";
import { mockTickets } from "./tickets.js";
import { mockAssets } from "./assets.js";
import { mockInventory } from "./inventory.js";
import { mockNotifications } from "./notifications.js";
import { mockReports } from "./reports.js";
import { mockTicketVolumeData, mockCategoryData, mockMttrData, mockSlaCompliance } from "./analytics.js";

// Re-export mock data for direct imports
export { mockUsers } from "./users.js";
export { mockTickets } from "./tickets.js";
export { mockAssets } from "./assets.js";
export { mockInventory } from "./inventory.js";
export { mockNotifications } from "./notifications.js";
export { mockReports } from "./reports.js";
export * from "./analytics.js";

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

export const mockDepartments = [
  { id: "d-1", name: "Information Technology", code: "IT", description: "Central IT and Support Service Department" },
  { id: "d-2", name: "Computer Science", code: "CS", description: "Department of Computer Science" },
  { id: "d-3", name: "Mechanical Engineering", code: "ME", description: "Department of Mechanical Engineering" },
];

export const mockCategories = [
  { id: "cat-1", name: "Wi-Fi & Network", code: "NET", defaultSlaHours: 4, active: true },
  { id: "cat-2", name: "Software Licenses", code: "SOFT", defaultSlaHours: 8, active: true },
  { id: "cat-3", name: "Hardware Repair", code: "HW", defaultSlaHours: 24, active: true },
  { id: "cat-4", name: "User Accounts", code: "ACCT", defaultSlaHours: 2, active: true },
];

export const mockAuditLogs = [
  { id: "l-1", timestamp: new Date("2026-07-31T17:30:00Z").toISOString(), action: "USER_LOGIN", details: "User admin@campuscare.edu logged in successfully from IP 192.168.1.52", performedBy: "Alex Admin", severity: "INFO" },
  { id: "l-2", timestamp: new Date("2026-07-31T17:45:00Z").toISOString(), action: "SESSION_REVOKED", details: "Session 489c-a812 revoked manually from devices panel", performedBy: "Alex Admin", severity: "WARN" },
  { id: "l-3", timestamp: new Date("2026-07-31T18:00:00Z").toISOString(), action: "ASSET_UPDATE", details: "Asset tag #CC-LAP-4029 location updated to Room 102", performedBy: "Sarah Technician", severity: "INFO" },
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

// Mock Delay Helper
export const simulateDelay = <T>(result: T, durationMs = 450): Promise<T> => {
  return new Promise((resolve) => setTimeout(() => resolve(result), durationMs));
};

// Legacy Adapters for Auth and Session (used directly by SessionsPage.tsx)
export const mockAdapters = {
  auth: {
    getMe: async (): Promise<AuthUser> => {
      const activeUser = mockUsers[0]!;
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
