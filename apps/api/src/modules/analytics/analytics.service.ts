import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

export class AnalyticsService {
  static async getStudentDashboard(userId: string) {
    logger.debug({ userId }, "AnalyticsService.getStudentDashboard");
    const totalTickets = await prisma.ticket.count({ where: { creatorId: userId } });
    const resolvedTicketsWaitingVerification = await prisma.ticket.count({
      where: { creatorId: userId, status: "RESOLVED" },
    });
    const activeTickets = await prisma.ticket.count({
      where: { creatorId: userId, status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING"] } },
    });
    const closedTickets = await prisma.ticket.count({ where: { creatorId: userId, status: "CLOSED" } });

    const recent = await prisma.ticket.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        assignee: true,
        category: true,
        department: true,
      },
    });

    const recentTickets = recent.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      title: t.title,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt.toISOString(),
    }));

    return {
      totalTickets,
      resolvedTicketsWaitingVerification,
      activeTickets,
      closedTickets,
      recentTickets,
    };
  }

  static async getTechnicianDashboard(userId: string) {
    logger.debug({ userId }, "AnalyticsService.getTechnicianDashboard");
    const assignedTickets = await prisma.ticket.count({
      where: { assigneeId: userId, status: { not: "CLOSED" } },
    });
    const urgentTickets = await prisma.ticket.count({
      where: { assigneeId: userId, priority: { in: ["HIGH", "CRITICAL"] }, status: { not: "CLOSED" } },
    });
    const reopenedTickets = await prisma.ticket.count({
      where: { assigneeId: userId, reopenCount: { gt: 0 }, status: { not: "CLOSED" } },
    });
    const slaBreachedTickets = await prisma.ticket.count({
      where: {
        assigneeId: userId,
        status: { not: "CLOSED" },
        dueAt: { lte: new Date() },
      },
    });

    const recent = await prisma.ticket.findMany({
      where: { assigneeId: userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    const recentAssignments = recent.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      title: t.title,
      status: t.status,
      priority: t.priority,
      updatedAt: t.updatedAt.toISOString(),
    }));

    return {
      assignedTickets,
      urgentTickets,
      reopenedTickets,
      slaBreachedTickets,
      recentAssignments,
    };
  }

  static async getDepartmentDashboard(departmentId: string) {
    logger.debug({ departmentId }, "AnalyticsService.getDepartmentDashboard");
    const totalTickets = await prisma.ticket.count({ where: { departmentId } });
    const activeTicketsCount = await prisma.ticket.count({ where: { departmentId, status: { not: "CLOSED" } } });
    const resolvedTicketsCount = await prisma.ticket.count({ where: { departmentId, status: "RESOLVED" } });

    // SLA compliance
    const totalResolvedOrClosed = await prisma.ticket.count({
      where: { departmentId, status: { in: ["RESOLVED", "CLOSED"] } },
    });
    const breachedCount = await prisma.ticket.count({
      where: {
        departmentId,
        OR: [
          { status: { in: ["RESOLVED", "CLOSED"] }, resolvedAt: { gt: prisma.ticket.fields.dueAt } },
          { status: { notIn: ["RESOLVED", "CLOSED"] }, dueAt: { lte: new Date() } },
        ],
      },
    });

    const slaComplianceRate = totalResolvedOrClosed > 0
      ? Math.max(0, Math.min(100, Math.round(((totalResolvedOrClosed - breachedCount) / totalResolvedOrClosed) * 100)))
      : 100;

    // MTTR hours
    const resolvedTickets = await prisma.ticket.findMany({
      where: { departmentId, resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
    });

    let avgResolutionHours = 0;
    if (resolvedTickets.length > 0) {
      const sum = resolvedTickets.reduce((acc, t) => {
        const diff = t.resolvedAt!.getTime() - t.createdAt.getTime();
        return acc + diff / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = parseFloat((sum / resolvedTickets.length).toFixed(1));
    }

    const priorityCounts = await prisma.ticket.groupBy({
      by: ["priority"],
      where: { departmentId },
      _count: { id: true },
    });
    const priorityDistribution = priorityCounts.reduce((acc: any, cur) => {
      acc[cur.priority] = cur._count.id;
      return acc;
    }, {});

    return {
      totalTickets,
      activeTicketsCount,
      resolvedTicketsCount,
      slaComplianceRate,
      avgResolutionHours,
      priorityDistribution,
    };
  }

  static async getAdminDashboard() {
    logger.debug("AnalyticsService.getAdminDashboard");
    const activeTicketsCount = await prisma.ticket.count({ where: { status: { not: "CLOSED" } } });
    const resolvedTicketsCount = await prisma.ticket.count({ where: { status: "RESOLVED" } });
    const closedTicketsCount = await prisma.ticket.count({ where: { status: "CLOSED" } });

    const totalTickets = await prisma.ticket.count();
    const breachedCount = await prisma.ticket.count({
      where: {
        OR: [
          { status: { in: ["RESOLVED", "CLOSED"] }, resolvedAt: { gt: prisma.ticket.fields.dueAt } },
          { status: { notIn: ["RESOLVED", "CLOSED"] }, dueAt: { lte: new Date() } },
        ],
      },
    });

    const globalSlaComplianceRate = totalTickets > 0
      ? Math.max(0, Math.min(100, Math.round(((totalTickets - breachedCount) / totalTickets) * 100)))
      : 100;

    const incidentCount = await prisma.incident.count({
      where: { status: { not: "RESOLVED" } },
    });
    const outagesCount = await prisma.incident.count({
      where: {
        status: { not: "RESOLVED" },
        severity: { in: ["HIGH", "CRITICAL"] },
      },
    });

    const depts = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            tickets: {
              where: { status: { not: "CLOSED" } },
            },
          },
        },
      },
    });
    const departmentWorkload = depts.map((d) => ({
      name: d.name,
      activeCount: d._count.tickets,
    }));

    return {
      activeTicketsCount,
      resolvedTicketsCount,
      closedTicketsCount,
      globalSlaComplianceRate,
      incidentCount,
      outagesCount,
      departmentWorkload,
    };
  }

  static async getChartsData() {
    logger.debug("AnalyticsService.getChartsData");
    const volume = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);

      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const opened = await prisma.ticket.count({
        where: {
          createdAt: { gte: day, lt: nextDay },
        },
      });

      const resolved = await prisma.ticket.count({
        where: {
          resolvedAt: { gte: day, lt: nextDay },
        },
      });

      volume.push({
        name: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        opened,
        resolved,
      });
    }

    const mttrTrend = [];
    for (let w = 3; w >= 0; w--) {
      const start = new Date(Date.now() - (w + 1) * 7 * 24 * 60 * 60 * 1000);
      const end = new Date(Date.now() - w * 7 * 24 * 60 * 60 * 1000);

      const tickets = await prisma.ticket.findMany({
        where: {
          resolvedAt: { gte: start, lt: end },
        },
        select: { createdAt: true, resolvedAt: true },
      });

      let hours = 0;
      if (tickets.length > 0) {
        const sum = tickets.reduce((acc, t) => {
          return acc + (t.resolvedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
        }, 0);
        hours = parseFloat((sum / tickets.length).toFixed(1));
      }

      mttrTrend.push({
        name: `Week -${w}`,
        hours,
      });
    }

    const categories = await prisma.category.findMany({
      select: {
        name: true,
        _count: {
          select: { tickets: true },
        },
      },
    });

    const categoryDistribution = categories.map((c) => ({
      name: c.name,
      value: c._count.tickets,
    }));

    return {
      ticketVolume: volume,
      mttrTrend,
      categoryDistribution,
    };
  }
}

