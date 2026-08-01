import { Server } from "socket.io";
import { logger } from "../utils/logger.js";

export class SocketService {
  private static io: Server | null = null;

  /**
   * Reference the active Socket.IO server.
   */
  static setIO(ioInstance: Server): void {
    this.io = ioInstance;
    logger.info("[SocketService] Server instance initialized in service registry");
  }

  /**
   * Send a direct, real-time message to a specific user's connected clients.
   */
  static emitToUser(userId: string, event: string, payload: any): boolean {
    if (!this.io) {
      logger.warn({ userId, event }, "[SocketService] Cannot emit message: Server instance not ready");
      return false;
    }
    logger.debug({ userId, event }, `[SocketService] Emitting message to user:${userId}`);
    this.io.to(`user:${userId}`).emit(event as any, payload);
    return true;
  }

  /**
   * Send a real-time message to a specific room channel.
   */
  static emitToRoom(room: string, event: string, payload: any): boolean {
    if (!this.io) {
      logger.warn({ room, event }, "[SocketService] Cannot emit message: Server instance not ready");
      return false;
    }
    logger.debug({ room, event }, `[SocketService] Emitting message to room ${room}`);
    this.io.to(room).emit(event as any, payload);
    return true;
  }

  /**
   * Broadcast a real-time message to all active, connected users.
   */
  static broadcast(event: string, payload: any): boolean {
    if (!this.io) {
      logger.warn({ event }, "[SocketService] Cannot broadcast message: Server instance not ready");
      return false;
    }
    logger.debug({ event }, "[SocketService] Broadcasting message to all connected clients");
    this.io.emit(event as any, payload);
    return true;
  }
}
export default SocketService;
