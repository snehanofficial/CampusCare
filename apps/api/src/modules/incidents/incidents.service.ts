import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

export class IncidentsService {
  static async getSummary() {
    logger.debug("Executing IncidentsService.getSummary");
    return { message: "Placeholder summary for incidents module" };
  }
}
