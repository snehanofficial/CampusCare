import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

export function authorize(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError("Not authenticated");
    }

    // SYSTEM_ADMIN bypasses all explicit permission checks
    if (user.role === "SYSTEM_ADMIN") {
      return next();
    }

    const hasAll = requiredPermissions.every((perm) =>
      user.permissions.includes(perm)
    );

    if (!hasAll) {
      throw new ForbiddenError(
        `Access denied. Required permissions: [${requiredPermissions.join(", ")}]`
      );
    }

    next();
  };
}
export default authorize;
