import { prisma } from "../../database/prisma.js";
import { Prisma } from "@prisma/client";

export class CategoriesRepository {
  static async findAll() {
    return prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    });
  }

  static async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput;
  }) {
    return prisma.category.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy || { sortOrder: "asc" },
    });
  }

  static async count(where?: Prisma.CategoryWhereInput) {
    return prisma.category.count({ where });
  }

  static async findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
    });
  }

  static async findByName(name: string) {
    return prisma.category.findUnique({
      where: { name },
    });
  }

  static async create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({
      data,
    });
  }

  static async update(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.category.delete({
      where: { id },
    });
  }
}
