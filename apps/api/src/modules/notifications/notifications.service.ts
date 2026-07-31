import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

export class NotificationsService {
  static async getSummary() {
    logger.debug("Executing NotificationsService.getSummary");
    return { message: "Placeholder summary for notifications module" };
  }
}
