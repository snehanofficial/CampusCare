import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

export class ReportsService {
  static async getSummary() {
    logger.debug("Executing ReportsService.getSummary");
    return { message: "Placeholder summary for reports module" };
  }
}
