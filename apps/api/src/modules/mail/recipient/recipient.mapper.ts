import { prisma } from "../../../database/prisma.js";
import { logger } from "../../../utils/logger.js";
import type { ResolvedRecipient, RecipientType } from "./recipient.types.js";

export class RecipientMapper {
  /**
   * Resolves target recipients based on category, title, and referenceId.
   */
  static async resolveRecipients(params: {
    userId?: string;
    category: string;
    title: string;
    referenceId?: string;
  }): Promise<ResolvedRecipient[]> {
    const catUpper = params.category?.toUpperCase();
    const titleLower = params.title?.toLowerCase();

    // 1. Direct single-user events (User created, updated)
    if (params.userId && (catUpper === "SYSTEM" || titleLower.includes("user"))) {
      const user = await prisma.user.findUnique({
        where: { id: params.userId, isActive: true },
        select: { id: true, email: true },
      });
      if (user) {
        return [{ email: user.email, userId: user.id, recipientType: "USER" }];
      }
    }

    // 2. Ticket-related recipient resolution
    if (catUpper === "TICKET" && params.referenceId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: params.referenceId },
        select: { creatorId: true, assigneeId: true },
      });

      if (ticket) {
        let targetId = ticket.creatorId;
        if (titleLower.includes("assigned")) {
          targetId = ticket.assigneeId || ticket.creatorId;
        }

        const user = await prisma.user.findUnique({
          where: { id: targetId, isActive: true },
          select: { id: true, email: true },
        });

        if (user) {
          return [{ email: user.email, userId: user.id, recipientType: "USER" }];
        }
      }
    }

    // 3. Incident-related recipient resolution
    if (catUpper === "INCIDENT" && params.referenceId) {
      const incident = await prisma.incidentTicket.findFirst({
        where: { incidentId: params.referenceId },
        select: { ticket: { select: { assigneeId: true, creatorId: true } } },
      });
      const targetId = incident?.ticket?.assigneeId || incident?.ticket?.creatorId;
      if (targetId) {
        const user = await prisma.user.findUnique({
          where: { id: targetId, isActive: true },
          select: { id: true, email: true },
        });
        if (user) {
          return [{ email: user.email, userId: user.id, recipientType: "USER" }];
        }
      }
    }

    // 4. Asset assignment recipient resolution
    if (catUpper === "ASSET" && params.referenceId) {
      const asset = await prisma.asset.findUnique({
        where: { id: params.referenceId },
        select: { departmentId: true },
      });
      if (asset?.departmentId) {
        const users = await prisma.user.findMany({
          where: {
            departmentId: asset.departmentId,
            isActive: true,
            role: { name: { in: ["TECHNICIAN", "DEPT_ADMIN"] } }
          },
          select: { id: true, email: true }
        });
        if (users.length > 0) {
          return users.map(user => ({ email: user.email, userId: user.id, recipientType: "ROLE" }));
        }
      }
    }

    // 5. Maintenance reminder recipient resolution
    if (catUpper === "MAINTENANCE" && params.referenceId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: params.referenceId },
        select: { assigneeId: true, creatorId: true },
      });
      const targetId = ticket?.assigneeId || ticket?.creatorId;
      if (targetId) {
        const user = await prisma.user.findUnique({
          where: { id: targetId, isActive: true },
          select: { id: true, email: true },
        });
        if (user) {
          return [{ email: user.email, userId: user.id, recipientType: "USER" }];
        }
      }
    }

    // 6. Inventory low stock recipient resolution -> send to all IT/Facilities managers
    if (catUpper === "INVENTORY") {
      const managers = await prisma.user.findMany({
        where: {
          isActive: true,
          role: { name: { in: ["TECHNICIAN", "DEPT_ADMIN", "SYSTEM_ADMIN"] } },
        },
        select: { id: true, email: true },
      });
      return managers.map((m) => ({ email: m.email, userId: m.id, recipientType: "ROLE" }));
    }

    // Fallback if userId is provided
    if (params.userId) {
      const user = await prisma.user.findUnique({
        where: { id: params.userId, isActive: true },
        select: { id: true, email: true },
      });
      if (user) {
        return [{ email: user.email, userId: user.id, recipientType: "USER" }];
      }
    }

    return [];
  }
}
export default RecipientMapper;
