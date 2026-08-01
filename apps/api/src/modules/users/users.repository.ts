import { prisma } from "../../database/prisma.js";
import { Prisma } from "@prisma/client";

export class UsersRepository {
  static async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    return prisma.user.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy || { createdAt: "desc" },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            createdTickets: true,
            assignedTickets: true,
          },
        },
      },
    });
  }

  static async count(where?: Prisma.UserWhereInput) {
    return prisma.user.count({ where });
  }

  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            createdTickets: true,
            assignedTickets: true,
          },
        },
      },
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  static async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  static async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  static async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }
}
