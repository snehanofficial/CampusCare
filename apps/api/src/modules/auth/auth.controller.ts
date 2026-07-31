import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import { sendSuccess } from "../../middleware/response.js";
import { loginSchema, registerSchema } from "@campuscare/shared-schemas";
import { UnauthorizedError } from "../../utils/errors.js";

const COOKIE_NAME = "refreshToken";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/api/v1/auth",
});

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
      const ipAddress = req.ip;
      const userAgent = req.headers["user-agent"];

      const result = await AuthService.login(parsed, ipAddress, userAgent);
      
      res.cookie(COOKIE_NAME, result.refreshToken, getCookieOptions());

      sendSuccess(res, {
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies[COOKIE_NAME];
      if (!rawRefreshToken) {
        throw new UnauthorizedError("Refresh token missing");
      }

      const ipAddress = req.ip;
      const userAgent = req.headers["user-agent"];

      const result = await AuthService.refresh(rawRefreshToken, ipAddress, userAgent);

      res.cookie(COOKIE_NAME, result.newRefreshToken, getCookieOptions());

      sendSuccess(res, {
        accessToken: result.accessToken,
      });
    } catch (err) {
      res.clearCookie(COOKIE_NAME, { path: "/api/v1/auth" });
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies[COOKIE_NAME];
      if (rawRefreshToken) {
        await AuthService.logout(rawRefreshToken);
      }
      res.clearCookie(COOKIE_NAME, { path: "/api/v1/auth" });
      sendSuccess(res, { message: "Successfully logged out" }, 200);
    } catch (err) {
      next(err);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError("Not authenticated");
      }
      const user = await AuthService.getMe(userId);
      sendSuccess(res, { user });
    } catch (err) {
      next(err);
    }
  }

  static async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError("Not authenticated");
      }
      const sessions = await AuthService.getActiveSessions(userId);
      sendSuccess(res, sessions);
    } catch (err) {
      next(err);
    }
  }

  static async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { sessionId } = req.params;
      if (!userId) {
        throw new UnauthorizedError("Not authenticated");
      }
      if (!sessionId) {
        throw new UnauthorizedError("Session ID required");
      }
      await AuthService.revokeSession(sessionId as string, userId);
      sendSuccess(res, { message: "Session revoked successfully" });
    } catch (err) {
      next(err);
    }
  }

  static async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError("Not authenticated");
      }
      await AuthService.logoutAll(userId);
      res.clearCookie(COOKIE_NAME, { path: "/api/v1/auth" });
      sendSuccess(res, { message: "Successfully logged out from all devices" });
    } catch (err) {
      next(err);
    }
  }
}
export default AuthController;
