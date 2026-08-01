import nodemailer from "nodemailer";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { TemplateEngine } from "./template.engine.js";

export class MailerService {
  private static transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // Use true for Port 465, false for others (e.g. 587/2525)
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  static async sendMail(to: string, templateName: string, variables: Record<string, any>): Promise<void> {
    try {
      // 1. Compile Handlebars HTML body
      const html = TemplateEngine.render(templateName, variables);

      // 2. Setup mail options
      const mailOptions = {
        from: env.SMTP_FROM,
        to,
        subject: variables.subject || "CampusCare Support Alert",
        html,
      };

      logger.info({ to, template: templateName }, "[MailerService] Sending transactional email via Nodemailer");

      // 3. Execute SMTP send
      await this.transporter.sendMail(mailOptions);

      logger.info({ to, template: templateName }, "[MailerService] SMTP email sent successfully");
    } catch (err: any) {
      logger.error(err, `[MailerService] Failed sending SMTP email to ${to} using template ${templateName}`);
      throw err;
    }
  }
}
export default MailerService;
