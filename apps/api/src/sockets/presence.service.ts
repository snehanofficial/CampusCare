import { Server } from "socket.io";
import { logger } from "../utils/logger.js";

export class PresenceService {
  // Map of userId -> Set of active socket IDs
  private static userSockets = new Map<string, Set<string>>();

  // Map of userId -> Last seen timestamp
  private static lastSeenRegistry = new Map<string, Date>();

  /**
   * Register a user connection and broadcast online presence on first login.
   */
  static handleConnect(userId: string, socketId: string, io: Server): void {
    let sockets = this.userSockets.get(userId);
    const isFirstConnection = !sockets || sockets.size === 0;

    if (!sockets) {
      sockets = new Set<string>();
      this.userSockets.set(userId, sockets);
    }

    sockets.add(socketId);
    this.lastSeenRegistry.set(userId, new Date());

    if (isFirstConnection) {
      logger.info({ userId }, "[PresenceService] User has come online");
      io.emit("presence:online", {
        userId,
        lastSeen: new Date().toISOString(),
      });
    }
  }

  /**
   * Deregister a socket connection and broadcast offline status when all tabs close.
   */
  static handleDisconnect(userId: string, socketId: string, io: Server): void {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    sockets.delete(socketId);
    const timestamp = new Date();
    this.lastSeenRegistry.set(userId, timestamp);

    if (sockets.size === 0) {
      this.userSockets.delete(userId);
      logger.info({ userId }, "[PresenceService] User has gone offline");
      io.emit("presence:offline", {
        userId,
        lastSeen: timestamp.toISOString(),
      });
    }
  }

  /**
   * Check if a user is currently connected to the server.
   */
  static isOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }

  /**
   * Get the last seen timestamp of a user.
   */
  static getLastSeen(userId: string): Date | undefined {
    return this.lastSeenRegistry.get(userId);
  }

  /**
   * Get list of all currently active online users.
   */
  static getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Helper to check presence registry metrics.
   */
  static getPresenceStatus() {
    return {
      onlineCount: this.userSockets.size,
      onlineUsers: Array.from(this.userSockets.keys()).map((userId) => ({
        userId,
        sessions: this.userSockets.get(userId)?.size || 0,
        lastSeen: this.lastSeenRegistry.get(userId)?.toISOString(),
      })),
    };
  }
}
export default PresenceService;
