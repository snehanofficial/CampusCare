import { NotificationProvider } from "../notifications/providers/provider.interface.js";
import { PushService } from "./push.service.js";

export class PushProvider implements NotificationProvider {
  /**
   * Send notification data to registered browser endpoints.
   */
  async send(params: {
    userId: string;
    title: string;
    message: string;
    category: string;
    type: string;
    referenceId?: string;
    actionUrl?: string;
  }): Promise<void> {
    await PushService.sendToUser(params.userId, {
      title: params.title,
      message: params.message,
      category: params.category,
      type: params.type,
      actionUrl: params.actionUrl,
    });
  }
}
export default PushProvider;
