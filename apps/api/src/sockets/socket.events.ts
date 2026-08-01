import { Server } from "socket.io";
import { logger } from "../utils/logger.js";
import { PresenceService } from "./presence.service.js";
import type { AuthenticatedSocket } from "./socket.types.js";

export function bindSocketEvents(socket: AuthenticatedSocket, io: Server): void {
  const user = socket.user;
  if (!user) return;

  // 1. Listen for client-side events
  socket.on("notification:read", (notificationId: string) => {
    logger.debug(
      { socketId: socket.id, userId: user.id, notificationId },
      "[SocketEvents] Client marked notification as read"
    );
    // Note: Database state updates should go through HTTP controllers, but we can broadcast UI sync here if needed.
  });

  // 2. Teardown listener on disconnect
  socket.on("disconnect", (reason: string) => {
    logger.info(
      { socketId: socket.id, userId: user.id, reason },
      "[SocketEvents] Socket connection terminated"
    );
    PresenceService.handleDisconnect(user.id, socket.id, io);
  });
}
export default bindSocketEvents;
