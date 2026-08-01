import { NotificationProvider } from "./provider.interface.js";
import { PushProvider as MailModulePushProvider } from "../../push/push.provider.js";

export class PushProvider implements NotificationProvider {
  private pushProvider = new MailModulePushProvider();

  async send(params: {
    userId: string;
    title: string;
    message: string;
    category: string;
    type: string;
    referenceId?: string;
    actionUrl?: string;
  }): Promise<void> {
    // Delegate browser push deliveries to the Push module provider
    await this.pushProvider.send(params);
  }
}
