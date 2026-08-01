import { prisma } from "../../database/prisma.js";
import { Prisma } from "@prisma/client";

export class SlaRepository {
  static async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.SlaPolicyWhereInput;
  }) {
    return prisma.slaPolicy.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: { priority: "asc" },
    });
  }

  static async count(where?: Prisma.SlaPolicyWhereInput) {
    return prisma.slaPolicy.count({ where });
  }

  static async findById(id: string) {
    return prisma.slaPolicy.findUnique({
      where: { id },
    });
  }

  static async findByPriority(priority: string) {
    return prisma.slaPolicy.findUnique({
      where: { priority },
    });
  }

  static async create(data: Prisma.SlaPolicyCreateInput) {
    return prisma.slaPolicy.create({ data });
  }

  static async update(id: string, data: Prisma.SlaPolicyUpdateInput) {
    return prisma.slaPolicy.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.slaPolicy.delete({ where: { id } });
  }
}
