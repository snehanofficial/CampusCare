import { IRepository } from "./base.repository.js";
import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";
import { isMockEnabled, simulateDelay, mockReports } from "../../mocks/index.js";
import type { MockReport } from "../../mocks/reports.js";

export interface IReportRepository extends IRepository<MockReport> {
  list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockReport>>;
}

class MockReportRepository implements IReportRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockReport>> {
    let list = [...mockReports];

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }

    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          list = list.filter((r: any) => String(r[key]) === String(val));
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

  async get(id: string): Promise<MockReport> {
    const item = mockReports.find((r) => r.id === id);
    if (!item) throw new Error("Report not found");
    return simulateDelay(item);
  }

  async create(data: Partial<MockReport>): Promise<MockReport> {
    const newReport: MockReport = {
      id: `r-${mockReports.length + 1}`,
      name: data.name || "Untitled Report",
      description: data.description || "Report template custom generated",
      type: data.type || "TICKET_VOLUME",
      status: "READY",
      generatedBy: data.generatedBy || "Alex Admin",
      createdAt: new Date().toISOString(),
      downloadUrl: `/downloads/r-${mockReports.length + 1}.pdf`,
    };
    mockReports.unshift(newReport);
    return simulateDelay(newReport);
  }

  async update(id: string, data: Partial<MockReport>): Promise<MockReport> {
    const index = mockReports.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Report not found");
    const updated = {
      ...mockReports[index]!,
      ...data,
    };
    mockReports[index] = updated;
    return simulateDelay(updated);
  }

  async delete(id: string): Promise<boolean> {
    const index = mockReports.findIndex((r) => r.id === id);
    if (index === -1) return simulateDelay(false);
    mockReports.splice(index, 1);
    return simulateDelay(true);
  }
}

class HttpReportRepository implements IReportRepository {
  async list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<MockReport>> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async get(id: string): Promise<MockReport> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async create(data: Partial<MockReport>): Promise<MockReport> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async update(id: string, data: Partial<MockReport>): Promise<MockReport> {
    throw new Error("HTTP Repository not connected yet.");
  }
  async delete(id: string): Promise<boolean> {
    throw new Error("HTTP Repository not connected yet.");
  }
}

export const reportRepository: IReportRepository = new Proxy(
  {} as IReportRepository,
  {
    get: (target, prop) => {
      const activeRepo = isMockEnabled() ? new MockReportRepository() : new HttpReportRepository();
      return Reflect.get(activeRepo, prop);
    },
  }
);
