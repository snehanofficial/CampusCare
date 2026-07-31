import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

export class AuditService {
  static async getSummary() {
    logger.debug("Executing AuditService.getSummary");
    return { message: "Placeholder summary for audit module" };
  }
}
