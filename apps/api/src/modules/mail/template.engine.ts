import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { logger } from "../../utils/logger.js";

export class TemplateEngine {
  private static helpersRegistered = false;

  private static getTemplatePath(fileName: string): string {
    const paths = [
      path.resolve(process.cwd(), "src/modules/mail/templates", fileName),
      path.resolve(process.cwd(), "dist/modules/mail/templates", fileName),
      path.resolve(process.cwd(), "apps/api/src/modules/mail/templates", fileName),
      path.resolve(process.cwd(), "apps/api/dist/modules/mail/templates", fileName),
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    logger.error({ file: fileName, paths }, "Handlebars template file not found");
    throw new Error(`Email template not found: ${fileName}`);
  }

  private static registerHelpers() {
    if (this.helpersRegistered) return;
    this.helpersRegistered = true;

    Handlebars.registerHelper("button", (text: string, url: string) => {
      // Return SafeString to bypass standard HTML escaping for components
      return new Handlebars.SafeString(`
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: auto; margin: 16px 0;">
          <tbody>
            <tr>
              <td style="font-family: sans-serif; font-size: 14px; vertical-align: top; border-radius: 6px; text-align: center; background-color: #6366f1;">
                <a href="${url || '#'}" target="_blank" style="border: solid 1px #6366f1; border-radius: 6px; box-sizing: border-box; cursor: pointer; display: inline-block; font-size: 13px; font-weight: bold; margin: 0; padding: 10px 20px; text-decoration: none; text-transform: none; background-color: #6366f1; border-color: #6366f1; color: #ffffff;">${text}</a>
              </td>
            </tr>
          </tbody>
        </table>
      `);
    });
  }

  static render(templateName: string, variables: Record<string, any>): string {
    this.registerHelpers();

    const layoutPath = this.getTemplatePath("layout.hbs");
    const templatePath = this.getTemplatePath(`${templateName}.hbs`);

    const layoutSource = fs.readFileSync(layoutPath, "utf-8");
    const templateSource = fs.readFileSync(templatePath, "utf-8");

    const compiledTemplate = Handlebars.compile(templateSource);
    const bodyContent = compiledTemplate(variables);

    const compiledLayout = Handlebars.compile(layoutSource);
    return compiledLayout({
      ...variables,
      body: new Handlebars.SafeString(bodyContent),
    });
  }
}
