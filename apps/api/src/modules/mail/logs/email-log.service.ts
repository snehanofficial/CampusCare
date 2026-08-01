import { prisma } from "../../../database/prisma.js";

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
}

export default EmailLogService;
