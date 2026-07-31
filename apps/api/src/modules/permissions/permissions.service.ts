import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

export class PermissionsService {
  static async getSummary() {
    logger.debug("Executing PermissionsService.getSummary");
    return { message: "Placeholder summary for permissions module" };
  }
}
