import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay, mockNotifications } from "../../mocks/index.js";
import type { MockNotification } from "../../mocks/notifications.js";
import { apiClient } from "../api-client.js";
import type { NotificationPreference } from "@campuscare/shared-types";

export interface INotificationRepository extends IRepository<MockNotification> {
  list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockNotification>>;
  markAllAsRead(): Promise<boolean>;
  markAsRead(id: string): Promise<boolean>;
  getPreferences(): Promise<NotificationPreference[]>;
  updatePreferences(preferences: Array<{ category: string; email: boolean; inApp: boolean; push: boolean }>): Promise<NotificationPreference[]>;
}

// Local mock state for preferences in sandbox mode
let mockPrefs: NotificationPreference[] = [
  { id: "p-1", userId: "u-1", category: "TICKET", email: true, inApp: true, push: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "p-2", userId: "u-1", category: "INCIDENT", email: true, inApp: true, push: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "p-3", userId: "u-1", category: "ASSET", email: true, inApp: true, push: false, createdAt: new Date(), updatedAt: new Date() },
  { id: "p-4", userId: "u-1", category: "MAINTENANCE", email: false, inApp: true, push: false, createdAt: new Date(), updatedAt: new Date() },
  { id: "p-5", userId: "u-1", category: "INVENTORY", email: true, inApp: true, push: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "p-6", userId: "u-1", category: "SLA", email: true, inApp: true, push: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "p-7", userId: "u-1", category: "SYSTEM", email: true, inApp: true, push: true, createdAt: new Date(), updatedAt: new Date() },
];

class MockNotificationRepository implements INotificationRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockNotification>> {
    let list = [...mockNotifications];

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q)
      );
    }

    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          if (key === "isRead") {
            const isReadVal = val === "true" || val === true;
            list = list.filter((n) => n.isRead === isReadVal);
          } else {
            list = list.filter((n: any) => String(n[key]) === String(val));
          }
        }
      });
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

  async get(id: string): Promise<MockNotification> {
    const item = mockNotifications.find((n) => n.id === id);
    if (!item) throw new Error("Notification not found");
    return simulateDelay(item);
  }

  async create(data: Partial<MockNotification>): Promise<MockNotification> {
    const newNotif: MockNotification = {
      id: `n-${mockNotifications.length + 1}`,
      title: data.title || "Announcement",
      message: data.message || "",
      type: data.type || "SYSTEM",
      isRead: false,
      createdAt: "Just now",
    };
    mockNotifications.unshift(newNotif); // Put newest first
    return simulateDelay(newNotif);
  }

  async update(id: string, data: Partial<MockNotification>): Promise<MockNotification> {
    const index = mockNotifications.findIndex((n) => n.id === id);
    if (index === -1) throw new Error("Notification not found");
    const updated = {
      ...mockNotifications[index]!,
      ...data,
    };
    mockNotifications[index] = updated;
    return simulateDelay(updated);
  }

  async delete(id: string): Promise<boolean> {
    const index = mockNotifications.findIndex((n) => n.id === id);
    if (index === -1) return simulateDelay(false);
    mockNotifications.splice(index, 1);
    return simulateDelay(true);
  }

  async markAllAsRead(): Promise<boolean> {
    mockNotifications.forEach((n) => {
      n.isRead = true;
    });
    return simulateDelay(true);
  }

  async markAsRead(id: string): Promise<boolean> {
    const item = mockNotifications.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      return simulateDelay(true);
    }
    return simulateDelay(false);
  }

  async getPreferences(): Promise<NotificationPreference[]> {
    return simulateDelay([...mockPrefs]);
  }

  async updatePreferences(
    preferences: Array<{ category: string; email: boolean; inApp: boolean; push: boolean }>
  ): Promise<NotificationPreference[]> {
    preferences.forEach((pref) => {
      const match = mockPrefs.find((p) => p.category === pref.category);
      if (match) {
        match.email = pref.email;
        match.inApp = pref.inApp;
        match.push = pref.push;
        match.updatedAt = new Date();
      }
    });
    return simulateDelay([...mockPrefs]);
  }
}

class HttpNotificationRepository implements INotificationRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockNotification>> {
    const response = await apiClient.get("/notifications", {
      params: {
        page: params?.page,
        limit: params?.pageSize,
        search: params?.search,
        ...params?.filters,
      },
    });
    return response.data.data;
  }

  async get(id: string): Promise<MockNotification> {
    const response = await apiClient.get(`/notifications/${id}`);
    return response.data.data;
  }

  async create(data: Partial<MockNotification>): Promise<MockNotification> {
    const response = await apiClient.post("/notifications/broadcast", data);
    return response.data.data;
  }

  async update(id: string, data: Partial<MockNotification>): Promise<MockNotification> {
    const response = await apiClient.patch(`/notifications/${id}`, data);
    return response.data.data;
  }

  async delete(id: string): Promise<boolean> {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data.success || response.data.data?.success || true;
  }

  async markAllAsRead(): Promise<boolean> {
    const response = await apiClient.post("/notifications/read-all");
    return response.data.success || response.data.data?.success || true;
  }

  async markAsRead(id: string): Promise<boolean> {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data.success || response.data.data?.success || true;
  }

  async getPreferences(): Promise<NotificationPreference[]> {
    const response = await apiClient.get("/notifications/preferences");
    return response.data.data;
  }

  async updatePreferences(
    preferences: Array<{ category: string; email: boolean; inApp: boolean; push: boolean }>
  ): Promise<NotificationPreference[]> {
    const response = await apiClient.put("/notifications/preferences", { preferences });
    return response.data.data;
  }
}

export const notificationRepository: INotificationRepository = new Proxy(
  {} as INotificationRepository,
  {
    get: (target, prop) => {
      const activeRepo = isMockEnabled() ? new MockNotificationRepository() : new HttpNotificationRepository();
      return Reflect.get(activeRepo, prop);
    },
  }
);
