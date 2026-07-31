import { AuthUser } from "@campuscare/shared-types";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        permissions: string[];
        departmentId?: string | null;
        sessionId?: string;
      };
    }
  }
}
