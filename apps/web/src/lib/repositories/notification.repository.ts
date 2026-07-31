import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay, mockNotifications } from "../../mocks/index.js";
import type { MockNotification } from "../../mocks/notifications.js";

export interface INotificationRepository extends IRepository<MockNotification> {
  list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockNotification>>;
  markAllAsRead(): Promise<boolean>;
}

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
}

class HttpNotificationRepository implements INotificationRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockNotification>> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async get(id: string): Promise<MockNotification> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async create(data: Partial<MockNotification>): Promise<MockNotification> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async update(id: string, data: Partial<MockNotification>): Promise<MockNotification> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async delete(id: string): Promise<boolean> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async markAllAsRead(): Promise<boolean> {
    throw new Error("HTTP Repository not connected yet.");
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
