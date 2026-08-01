import { Socket } from "socket.io";

export interface UserSocketPayload {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  departmentId?: string | null;
  sessionId?: string;
}

export interface AuthenticatedSocket extends Socket {
  user?: UserSocketPayload;
}

export interface ServerToClientEvents {
  "notification:new": (notification: any) => void;
  "notification:update": (notification: any) => void;
  "presence:online": (data: { userId: string; lastSeen: string }) => void;
  "presence:offline": (data: { userId: string; lastSeen: string }) => void;
  "dashboard:update": (data: { type: string; referenceId?: string }) => void;
}

export interface ClientToServerEvents {
  "notification:read": (notificationId: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
}
