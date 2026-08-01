import { NotificationProvider } from "./provider.interface.js";
import { EmailProvider as MailModuleEmailProvider } from "../../mail/email.provider.js";

export class EmailProvider implements NotificationProvider {
  private mailProvider = new MailModuleEmailProvider();

  async send(params: {
    userId: string;
    title: string;
    message: string;
    category: string;
    type: string;
    referenceId?: string;
    actionUrl?: string;
    recipientType?: string;
    eventType?: string;
  }): Promise<void> {
    // Delegate SMTP enqueueing to the Mail module provider
    await this.mailProvider.send(params);
  }
}
