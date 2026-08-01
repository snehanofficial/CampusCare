import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { logger } from "../utils/logger.js";
import { socketAuthMiddleware } from "./socket.middleware.js";
import { PresenceService } from "./presence.service.js";
import { joinUserRooms } from "./socket.rooms.js";
import { bindSocketEvents } from "./socket.events.js";
import { SocketService } from "./socket.service.js";
import type { AuthenticatedSocket } from "./socket.types.js";

export function initSocketServer(httpServer: HttpServer): Server {
  logger.info("[SocketServer] Bootstrapping Socket.IO server configuration...");

  // 1. Instantiate the Socket.IO Server with permissive CORS configurations
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Matches API CORS requirements
      methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 15000,
  });

  // 2. Load token handshake authentication middleware
  io.use(socketAuthMiddleware as any);

  // 3. Register client lifecycle handles
  io.on("connection", (socket: AuthenticatedSocket) => {
    const user = socket.user;
    if (!user) {
      logger.error({ socketId: socket.id }, "[SocketServer] Denied socket: No user parsed after authentication middleware");
      socket.disconnect(true);
      return;
    }

    logger.info(
      { socketId: socket.id, userId: user.id, email: user.email, role: user.role },
      "[SocketServer] Connected new client handshake session"
    );

    // Track online presence in-memory
    PresenceService.handleConnect(user.id, socket.id, io);

    // Auto-allocate socket to relevant group rooms
    joinUserRooms(socket).catch((err) => {
      logger.error(err, `[SocketServer] Room allocation failed for user ${user.id}`);
    });

    // Wire up events and disconnect handles
    bindSocketEvents(socket, io);
  });

  // 4. Inject server context reference inside SocketService registry
  SocketService.setIO(io);

  logger.info("⚡ Socket.IO server bound and running smoothly");
  return io;
}
export default initSocketServer;
