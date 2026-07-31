import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

export class CategoriesService {
  static async getSummary() {
    logger.debug("Executing CategoriesService.getSummary");
    return { message: "Placeholder summary for categories module" };
  }
}
