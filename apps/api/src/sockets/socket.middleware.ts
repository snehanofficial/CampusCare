import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";
import type { AuthenticatedSocket, UserSocketPayload } from "./socket.types.js";

export async function socketAuthMiddleware(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    // 1. Extract token from auth payload or handshake headers
    let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    if (!token) {
      logger.warn({ socketId: socket.id }, "[SocketAuthMiddleware] Authentication failed: No token provided");
      return next(new Error("Authentication failed: Access token required"));
    }

    // Strip "Bearer " prefix if present
    if (token.startsWith("Bearer ")) {
      token = token.slice(7);
    }

    // 2. Verify JWT token
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;

    if (!decoded || !decoded.userId) {
      return next(new Error("Authentication failed: Invalid token payload"));
    }

    // 3. Ensure user is active in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isActive: true },
    });

    if (!user || !user.isActive) {
      logger.warn({ userId: decoded.userId }, "[SocketAuthMiddleware] Authentication failed: User is disabled or does not exist");
      return next(new Error("Authentication failed: User account inactive"));
    }

    // 4. Attach decoded profile metadata to socket instance
    const socketUser: UserSocketPayload = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
      departmentId: decoded.departmentId,
      sessionId: decoded.sessionId,
    };

    socket.user = socketUser;
    logger.debug({ socketId: socket.id, userId: socketUser.id }, "[SocketAuthMiddleware] Socket authenticated successfully");
    next();
  } catch (err: any) {
    logger.error(err, `[SocketAuthMiddleware] Authentication failed for socket ${socket.id}`);
    next(new Error("Authentication failed: Invalid or expired token"));
  }
}
export default socketAuthMiddleware;
