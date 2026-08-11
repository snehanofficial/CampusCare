import { prisma } from "../../database/prisma.js";

/** Ticket statuses that count as "open work" for workload purposes. */
export const OPEN_TICKET_STATUSES = ["ASSIGNED", "IN_PROGRESS", "PENDING"] as const;

export class TechniciansRepository {
  /** Active TECHNICIAN users in a department, with their availability row (if any). */
  static async findEligibleCandidates(departmentId: string) {
    return prisma.user.findMany({
      where: {
        isActive: true,
        departmentId,
        role: { name: "TECHNICIAN" },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        departmentId: true,
        technicianAvailability: true,
      },
    });
  }

  /** Live open-ticket count per technician — never a cached/stale counter. */
  static async getWorkloadCounts(technicianIds: string[]): Promise<Map<string, number>> {
    if (technicianIds.length === 0) return new Map();
    const rows = await prisma.ticket.groupBy({
      by: ["assigneeId"],
      where: {
        assigneeId: { in: technicianIds },
        status: { in: [...OPEN_TICKET_STATUSES] },
      },
      _count: { _all: true },
    });
    const map = new Map<string, number>();
    for (const id of technicianIds) map.set(id, 0);
    for (const row of rows) {
      if (row.assigneeId) map.set(row.assigneeId, row._count._all);
    }
    return map;
  }

  static async getAvailability(technicianId: string) {
    return prisma.technicianAvailability.findUnique({ where: { technicianId } });
  }

  static async listAvailability(departmentId?: string) {
    return prisma.technicianAvailability.findMany({
      where: departmentId ? { technician: { departmentId } } : {},
      include: { technician: { select: { id: true, firstName: true, lastName: true, email: true, departmentId: true } } },
    });
  }

  static async upsertAvailability(
    technicianId: string,
    data: { isManuallyUnavailable: boolean; unavailableUntil: Date | null; reason: string | null; setById: string },
  ) {
    return prisma.technicianAvailability.upsert({
      where: { technicianId },
      update: data,
      create: { technicianId, ...data },
    });
  }

  /** Rows whose temporary unavailability window has passed and hasn't been cleared yet. */
  static async findExpiredUnavailability(now: Date) {
    return prisma.technicianAvailability.findMany({
      where: {
        isManuallyUnavailable: true,
        unavailableUntil: { not: null, lte: now },
      },
    });
  }

  static async clearUnavailability(ids: string[]) {
    if (ids.length === 0) return { count: 0 };
    return prisma.technicianAvailability.updateMany({
      where: { id: { in: ids } },
      data: { isManuallyUnavailable: false, unavailableUntil: null, reason: null },
    });
  }
}

export default TechniciansRepository;
