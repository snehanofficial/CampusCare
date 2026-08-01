import { logger } from "../../utils/logger.js";
import { RolesRepository } from "./roles.repository.js";

export class RolesService {
  static async getSummary() {
    logger.debug("Executing RolesService.getSummary");
    return { message: "Placeholder summary for roles module" };
  }

  static async listRoles() {
    logger.debug("Executing RolesService.listRoles");
    return RolesRepository.findAll();
  }
}

