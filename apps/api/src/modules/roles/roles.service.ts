import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

export class RolesService {
  static async getSummary() {
    logger.debug("Executing RolesService.getSummary");
    return { message: "Placeholder summary for roles module" };
  }
}
