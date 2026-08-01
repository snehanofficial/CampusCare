import { prisma } from "../../database/prisma.js";
import { Prisma } from "@prisma/client";

// ─── Shared include block ─────────────────────────────────────────────────────
const TICKET_INCLUDE = {
  creator: {
    select: { id: true, email: true, firstName: true, lastName: true },
  },
  assignee: {
    select: { id: true, email: true, firstName: true, lastName: true },
  },
  category: { select: { id: true, name: true } },
  department: { select: { id: true, name: true, code: true } },
  incidents: {
    include: {
      incident: {
        select: { id: true, title: true, status: true, severity: true },
      },
    },
  },
  comments: {
    include: {
      author: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "asc" } as const,
  },
} satisfies Prisma.TicketInclude;

// ─── Repository ───────────────────────────────────────────────────────────────
export class TicketsRepository {
  static async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.TicketWhereInput;
    orderBy?: Prisma.TicketOrderByWithRelationInput;
  }) {
    return prisma.ticket.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy ?? { createdAt: "desc" },
      include: TICKET_INCLUDE,
    });
  }

  static async count(where?: Prisma.TicketWhereInput) {
    return prisma.ticket.count({ where });
  }

  static async findById(id: string) {
    return prisma.ticket.findUnique({
      where: { id },
      include: TICKET_INCLUDE,
    });
  }

  static async findByTicketNumber(ticketNumber: string) {
    return prisma.ticket.findUnique({
      where: { ticketNumber },
      include: TICKET_INCLUDE,
    });
  }

  static async create(data: Prisma.TicketCreateInput) {
    return prisma.ticket.create({ data, include: TICKET_INCLUDE });
  }

  static async update(id: string, data: Prisma.TicketUpdateInput) {
    return prisma.ticket.update({ where: { id }, data, include: TICKET_INCLUDE });
  }

  static async delete(id: string) {
    // Cascade via schema handles comments, attachments, incidentTickets
    return prisma.ticket.delete({ where: { id } });
  }

  // ─── Comments ──────────────────────────────────────────────────────────
  static async addComment(
    ticketId: string,
    authorId: string,
    content: string,
    isInternal: boolean,
  ) {
    return prisma.ticketComment.create({
      data: { ticketId, authorId, content, isInternal },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  static async deleteComment(commentId: string) {
    return prisma.ticketComment.delete({ where: { id: commentId } });
  }
}
