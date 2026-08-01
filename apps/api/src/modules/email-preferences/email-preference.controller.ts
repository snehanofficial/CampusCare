import { Request, Response, NextFunction } from "express";
import { EmailPreferenceService } from "./email-preference.service.js";
import { emailPreferenceUpdateSchema } from "./email-preference.validator.js";
import { sendSuccess } from "../../middleware/response.js";
import { UnauthorizedError } from "../../utils/errors.js";

export class EmailPreferenceController {
  /**
   * GET /api/v1/email-preferences
   * List all available email events with user setting flags.
   */
  static async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const result = await EmailPreferenceService.getHydratedUserPreferences(req.user.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/email-preferences
   * Bulk updates user email preferences.
   */
  static async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const validatedBody = emailPreferenceUpdateSchema.parse(req.body);
      const result = await EmailPreferenceService.updateUserPreferences(
        req.user.id,
        validatedBody.preferences
      );

      sendSuccess(res, { success: true, count: result.length });
    } catch (err) {
      next(err);
    }
  }
}
export default EmailPreferenceController;
