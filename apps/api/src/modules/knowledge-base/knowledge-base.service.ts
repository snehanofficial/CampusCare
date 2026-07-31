import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

export class KnowledgeBaseService {
  static async getSummary() {
    logger.debug("Executing KnowledgeBaseService.getSummary");
    return { message: "Placeholder summary for knowledge-base module" };
  }
}
