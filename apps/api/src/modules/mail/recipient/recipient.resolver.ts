import { prisma } from "../../../database/prisma.js";
import { logger } from "../../../utils/logger.js";
import type { ResolvedRecipient, AudienceType } from "./recipient.types.js";
import { RecipientMapper } from "./recipient.mapper.js";

export class RecipientResolver {
  /**
   * Resolve recipients for a transaction notification event.
   */
  static async resolve(params: {
    userId?: string;
    category: string;
    title: string;
    referenceId?: string;
  }): Promise<ResolvedRecipient[]> {
    try {
      return await RecipientMapper.resolveRecipients(params);
    } catch (err) {
      logger.error(err, "[RecipientResolver] Error resolving event recipients");
      return [];
    }
  }

  /**
   * Resolve all active user recipients matching a specific broadcast target audience group.
   */
  static async resolveAudience(
    audience: AudienceType,
    customUserIds?: string[]
  ): Promise<ResolvedRecipient[]> {
    try {
      logger.info({ audience }, "[RecipientResolver] Resolving active audience list");

      if (audience === "CUSTOM_USERS" && customUserIds && customUserIds.length > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: customUserIds }, isActive: true },
          select: { id: true, email: true }
        });
        return users.map((u) => ({ email: u.email, userId: u.id, recipientType: "USER" }));
      }

      const whereClause: any = { isActive: true };

      if (audience === "STUDENTS") {
        whereClause.role = { name: "STUDENT" };
      } else if (audience === "FACULTY") {
        whereClause.role = { name: "FACULTY" };
      } else if (audience === "TECHNICIANS") {
        whereClause.role = { name: "TECHNICIAN" };
      } else if (audience === "DEPARTMENT_ADMIN") {
        whereClause.role = { name: "DEPT_ADMIN" };
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: { id: true, email: true }
      });

      return users.map((u) => ({
        email: u.email,
        userId: u.id,
        recipientType: audience === "ALL_USERS" ? "ALL_USERS" : "ROLE"
      }));
    } catch (err) {
      logger.error(err, `[RecipientResolver] Failed to resolve audience: ${audience}`);
      return [];
    }
  }
}
export default RecipientResolver;
