import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

export class AssetsService {
  static async getSummary() {
    logger.debug("Executing AssetsService.getSummary");
    return { message: "Placeholder summary for assets module" };
  }
}
