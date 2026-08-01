import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

export class AuditService {
  static async getSummary() {
    logger.debug("Executing AuditService.getSummary");
    const logs = await prisma.auditLog.findMany({
      include: { performedBy: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return logs.map(l => ({
      id: l.id,
      timestamp: l.createdAt.toISOString(),
      action: l.action,
      details: `Updated ${l.targetTable} records (ID: ${l.targetId.slice(0,8).toUpperCase()})`,
      performedBy: `${l.performedBy.firstName} ${l.performedBy.lastName}`,
      severity: l.action.includes("ERROR") || l.action.includes("FAIL") ? "ERROR" : "INFO"
    }));
  }
}
