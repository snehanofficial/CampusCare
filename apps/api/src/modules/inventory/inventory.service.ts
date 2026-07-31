import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

export class InventoryService {
  static async getSummary() {
    logger.debug("Executing InventoryService.getSummary");
    return { message: "Placeholder summary for inventory module" };
  }
}
