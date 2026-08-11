import { prisma } from "../../../database/prisma.js";
import { Prisma } from "@prisma/client";

export class EmailLogRepository {
  static async createLog(data: Prisma.EmailLogCreateInput) {
    return prisma.emailLog.create({
      data,
    });
  }

  static async getLogs(params: {
    skip?: number;
    take?: number;
    where?: Prisma.EmailLogWhereInput;
    orderBy?: Prisma.EmailLogOrderByWithRelationInput;
  }) {
    const [total, items] = await Promise.all([
      prisma.emailLog.count({ where: params.where }),
      prisma.emailLog.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy || { timestamp: "desc" },
      }),
    ]);

    return { total, items };
  }

  static async getLogById(id: string) {
    return prisma.emailLog.findUnique({
      where: { id },
    });
  }
}
export default EmailLogRepository;
