import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay, mockUsers } from "../../mocks/index.js";
import type { MockUser } from "../../mocks/users.js";

export interface IUserRepository extends IRepository<MockUser> {
  list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockUser>>;
}

class MockUserRepository implements IUserRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockUser>> {
    let list = [...mockUsers];

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (u) =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          list = list.filter((u: any) => String(u[key]) === String(val));
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

  async get(id: string): Promise<MockUser> {
    const item = mockUsers.find((u) => u.id === id);
    if (!item) throw new Error("User not found");
    return simulateDelay(item);
  }

  async create(data: Partial<MockUser>): Promise<MockUser> {
    const newUser: MockUser = {
      id: `u-${mockUsers.length + 1}`,
      email: data.email || `new.user${mockUsers.length + 1}@campuscare.edu`,
      firstName: data.firstName || "New",
      lastName: data.lastName || "User",
      role: data.role || "STUDENT",
      departmentId: data.departmentId || "d-1",
      phone: data.phone || "",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    return simulateDelay(newUser);
  }

  async update(id: string, data: Partial<MockUser>): Promise<MockUser> {
    const index = mockUsers.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("User not found");
    const updated = {
      ...mockUsers[index]!,
      ...data,
    };
    mockUsers[index] = updated;
    return simulateDelay(updated);
  }

  async delete(id: string): Promise<boolean> {
    const index = mockUsers.findIndex((u) => u.id === id);
    if (index === -1) return simulateDelay(false);
    mockUsers.splice(index, 1);
    return simulateDelay(true);
  }
}

class HttpUserRepository implements IUserRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockUser>> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async get(id: string): Promise<MockUser> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async create(data: Partial<MockUser>): Promise<MockUser> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async update(id: string, data: Partial<MockUser>): Promise<MockUser> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async delete(id: string): Promise<boolean> {
    throw new Error("HTTP Repository not connected yet.");
  }
}

export const userRepository: IUserRepository = new Proxy(
  {} as IUserRepository,
  {
    get: (target, prop) => {
      const activeRepo = isMockEnabled() ? new MockUserRepository() : new HttpUserRepository();
      return Reflect.get(activeRepo, prop);
    },
  }
);
