import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

export class UsersService {
  static async getSummary() {
    logger.debug("Executing UsersService.getSummary");
    return { message: "Placeholder summary for users module" };
  }
}
