import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

export class PermissionsService {
  static async getSummary() {
    logger.debug("Executing PermissionsService.getSummary");
    return { message: "Placeholder summary for permissions module" };
  }

  /**
   * Full permission registry grouped by category, then by group label.
   * Consumed by the GTPE permission selector so nothing is hardcoded client-side.
   */
  static async getRegistry() {
    logger.debug("Executing PermissionsService.getRegistry");

    const permissions = await prisma.permission.findMany({
      select: {
        id: true,
        code: true,
        displayName: true,
        description: true,
        category: true,
        groupLabel: true,
      },
      orderBy: [{ category: "asc" }, { groupLabel: "asc" }, { displayName: "asc" }],
    });

    const byCategory = new Map<string, typeof permissions>();
    for (const permission of permissions) {
      const bucket = byCategory.get(permission.category);
      if (bucket) {
        bucket.push(permission);
      } else {
        byCategory.set(permission.category, [permission]);
      }
    }

    return {
      total: permissions.length,
      categories: [...byCategory.entries()].map(([category, items]) => ({
        category,
        permissions: items,
      })),
    };
  }
}
