import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../database/prisma.js";
import { UnauthorizedError } from "../utils/errors.js";

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  departmentId?: string | null;
  sessionId?: string;
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or invalid Authorization header");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new UnauthorizedError("Bearer token not found");
    }

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        algorithms: ["HS256"],
      }) as DecodedToken;
    } catch (err) {
      throw new UnauthorizedError("Access token is invalid or expired");
    }

    // Optional: check in DB if user is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError("User account is disabled or does not exist");
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions,
      departmentId: decoded.departmentId,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error) {
    next(error);
  }
}
export default authenticate;
