import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

export class AnalyticsService {
  static async getSummary() {
    logger.debug("Executing AnalyticsService.getSummary");
    return { message: "Placeholder summary for analytics module" };
  }
}
