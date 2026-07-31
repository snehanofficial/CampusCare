import { authStore } from "./auth-store.js";

export type LogSeverity = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  timestamp: string;
  severity: LogSeverity;
  module: string;
  message: string;
  userId?: string | null;
  requestId?: string | null;
  environment: string;
  details?: any;
}

let latestRequestId: string | null = null;

export function setLatestRequestId(id: string | null) {
  latestRequestId = id;
}

export function getLatestRequestId(): string | null {
  return latestRequestId;
}

function getUserIdFromToken(): string | null {
  const token = authStore.getAccessToken();
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]!));
      return payload.sub || payload.userId || payload.id || null;
    }
  } catch {
    // Fail silently
  }
  return null;
}

function writeLog(severity: LogSeverity, module: string, message: string, details?: any) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    severity,
    module,
    message,
    userId: getUserIdFromToken(),
    requestId: latestRequestId,
    environment: import.meta.env.MODE || "development",
    details,
  };

  const formattedMsg = `[${entry.timestamp}] [${entry.severity}] [${entry.module}] ${entry.message} (User: ${entry.userId || "guest"}, RequestID: ${entry.requestId || "none"})`;

  switch (severity) {
    case "DEBUG":
      if (import.meta.env.DEV) {
        console.debug(formattedMsg, details || "");
      }
      break;
    case "INFO":
      console.log(formattedMsg, details || "");
      break;
    case "WARN":
      console.warn(formattedMsg, details || "");
      break;
    case "ERROR":
      console.error(formattedMsg, details || "");
      break;
  }
}

export const logger = {
  debug: (module: string, message: string, details?: any) => writeLog("DEBUG", module, message, details),
  info: (module: string, message: string, details?: any) => writeLog("INFO", module, message, details),
  warn: (module: string, message: string, details?: any) => writeLog("WARN", module, message, details),
  error: (module: string, message: string, details?: any) => writeLog("ERROR", module, message, details),
};
