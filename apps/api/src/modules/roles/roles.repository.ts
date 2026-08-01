import { prisma } from "../../database/prisma.js";

export class RolesRepository {
  static async findAll() {
    return prisma.role.findMany({
      orderBy: { displayName: "asc" },
    });
  }

  static async findById(id: string) {
    return prisma.role.findUnique({
      where: { id },
    });
  }

  static async findByName(name: string) {
    return prisma.role.findUnique({
      where: { name },
    });
  }
}
