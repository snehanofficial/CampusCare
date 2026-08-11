import { Prisma } from "@prisma/client";
import { prisma } from "../../../database/prisma.js";
import { EmailLogRepository } from "./email-log.repository.js";

interface EmailLogInput {
  recipient: string;
  template: string;
  status: string;
  retryCount: number;
  error?: string;
  recipientType?: string | null;
  eventType?: string | null;
  userId?: string | null;
}

export class EmailLogService {
  static async log(input: EmailLogInput) {
    return prisma.emailLog.create({
      data: {
        recipient: input.recipient,
        template: input.template,
        status: input.status,
        retryCount: input.retryCount,
        error: input.error,
        recipientType: input.recipientType,
        eventType: input.eventType,
        userId: input.userId,
      },
    });
  }

  static async getLogs(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.EmailLogWhereInput = {};
    if (params.search) {
      where.OR = [
        { recipient: { contains: params.search, mode: "insensitive" } },
        { template: { contains: params.search, mode: "insensitive" } },
      ];
    }
    if (params.status) {
      where.status = params.status;
    }

    const { total, items } = await EmailLogRepository.getLogs({
      skip,
      take: pageSize,
      where,
    });

    return {
      data: items,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    };
  }

  static async getLogById(id: string) {
    return EmailLogRepository.getLogById(id);
  }
}

export default EmailLogService;
