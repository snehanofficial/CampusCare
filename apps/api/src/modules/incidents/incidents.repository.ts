import { prisma } from "../../database/prisma.js";
import { Prisma } from "@prisma/client";

const INCIDENT_INCLUDE = {
  tickets: {
    include: {
      ticket: {
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      },
    },
  },
} satisfies Prisma.IncidentInclude;

export class IncidentsRepository {
  static async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.IncidentWhereInput;
    orderBy?: Prisma.IncidentOrderByWithRelationInput;
  }) {
    return prisma.incident.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy ?? { createdAt: "desc" },
      include: INCIDENT_INCLUDE,
    });
  }

  static async count(where?: Prisma.IncidentWhereInput) {
    return prisma.incident.count({ where });
  }

  static async findById(id: string) {
    return prisma.incident.findUnique({
      where: { id },
      include: INCIDENT_INCLUDE,
    });
  }

  static async create(data: Prisma.IncidentCreateInput) {
    return prisma.incident.create({ data, include: INCIDENT_INCLUDE });
  }

  static async update(id: string, data: Prisma.IncidentUpdateInput) {
    return prisma.incident.update({ where: { id }, data, include: INCIDENT_INCLUDE });
  }

  static async delete(id: string) {
    return prisma.incident.delete({ where: { id } });
  }

  // ── Ticket linking ──────────────────────────────────────────────────────────
  static async linkTickets(incidentId: string, ticketIds: string[]) {
    if (ticketIds.length === 0) return;
    await prisma.incidentTicket.createMany({
      data: ticketIds.map((ticketId) => ({ incidentId, ticketId })),
      skipDuplicates: true,
    });
  }

  static async replaceTicketLinks(incidentId: string, ticketIds: string[]) {
    // Remove old links then re-create
    await prisma.incidentTicket.deleteMany({ where: { incidentId } });
    if (ticketIds.length > 0) {
      await prisma.incidentTicket.createMany({
        data: ticketIds.map((ticketId) => ({ incidentId, ticketId })),
        skipDuplicates: true,
      });
    }
  }
}
