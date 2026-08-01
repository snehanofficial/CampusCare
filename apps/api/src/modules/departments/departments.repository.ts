import { prisma } from "../../database/prisma.js";
import { Prisma } from "@prisma/client";

export class DepartmentsRepository {
  static async findAll() {
    return prisma.department.findMany({
      orderBy: { name: "asc" },
    });
  }

  static async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.DepartmentWhereInput;
    orderBy?: Prisma.DepartmentOrderByWithRelationInput;
  }) {
    return prisma.department.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy || { name: "asc" },
    });
  }

  static async count(where?: Prisma.DepartmentWhereInput) {
    return prisma.department.count({ where });
  }

  static async findById(id: string) {
    return prisma.department.findUnique({
      where: { id },
    });
  }

  static async findByCode(code: string) {
    return prisma.department.findUnique({
      where: { code },
    });
  }

  static async findByName(name: string) {
    return prisma.department.findUnique({
      where: { name },
    });
  }

  static async create(data: Prisma.DepartmentCreateInput) {
    return prisma.department.create({
      data,
    });
  }

  static async update(id: string, data: Prisma.DepartmentUpdateInput) {
    return prisma.department.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.department.delete({
      where: { id },
    });
  }
}
