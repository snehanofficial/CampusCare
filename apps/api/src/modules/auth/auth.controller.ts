import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import { sendSuccess } from "../../middleware/response.js";
import { loginSchema, registerSchema } from "@campuscare/shared-schemas";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = registerSchema.parse(req.body);
      const result = await AuthService.register(parsed);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginSchema.parse(req.body);
      const result = await AuthService.login(parsed);
      
      // Store refreshToken in HttpOnly cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      sendSuccess(res, {
        user: result.user,
        accessToken: result.accessToken
      });
    } catch (err) {
      next(err);
    }
  }
}
