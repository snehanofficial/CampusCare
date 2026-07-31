import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

export class DepartmentsService {
  static async getSummary() {
    logger.debug("Executing DepartmentsService.getSummary");
    return { message: "Placeholder summary for departments module" };
  }
}
