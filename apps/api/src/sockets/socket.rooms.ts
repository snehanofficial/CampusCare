import { logger } from "../utils/logger.js";
import type { AuthenticatedSocket } from "./socket.types.js";

export async function joinUserRooms(socket: AuthenticatedSocket): Promise<void> {
  const user = socket.user;
  if (!user) return;

  const roomsToJoin: string[] = [];

  // 1. Direct user-specific unicast channel
  roomsToJoin.push(`user:${user.id}`);

  // 2. Global system broadcast channel
  roomsToJoin.push("system");

  // 3. Administrative role channels
  if (user.role === "ADMIN") {
    roomsToJoin.push("admin");
  }

  // 4. Technician role channels
  if (user.role === "TECHNICIAN") {
    roomsToJoin.push("technician");
    roomsToJoin.push(`technician:${user.id}`);
  }

  // 5. Department-specific channels
  if (user.departmentId) {
    roomsToJoin.push(`department:${user.departmentId}`);
  }

  // Execute room join
  await socket.join(roomsToJoin);

  logger.debug(
    { socketId: socket.id, userId: user.id, rooms: roomsToJoin },
    "[SocketRooms] Sockets joined target rooms"
  );
}

export async function leaveUserRooms(socket: AuthenticatedSocket): Promise<void> {
  // Sockets automatically leave rooms on disconnect, but we can log or perform cleanups here if needed.
  logger.debug({ socketId: socket.id, userId: socket.user?.id }, "[SocketRooms] Socket left rooms");
}
export default joinUserRooms;
