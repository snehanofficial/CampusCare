import { prisma } from "../../../database/prisma.js";
import { NotificationProvider } from "./provider.interface.js";
import { SocketService } from "../../../sockets/socket.service.js";

export class InAppProvider implements NotificationProvider {
  async send(params: {
    userId: string;
    title: string;
    message: string;
    category: string;
    type: string;
    referenceId?: string;
    actionUrl?: string;
  }): Promise<void> {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        category: params.category,
        type: params.type,
        referenceId: params.referenceId || null,
        actionUrl: params.actionUrl || null,
      },
    });

    // Send real-time notification push to all open tabs for this user
    SocketService.emitToUser(params.userId, "notification:new", notification);
  }
}
