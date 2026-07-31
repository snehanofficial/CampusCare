import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

export class SlaService {
  static async getSummary() {
    logger.debug("Executing SlaService.getSummary");
    return { message: "Placeholder summary for sla module" };
  }
}
