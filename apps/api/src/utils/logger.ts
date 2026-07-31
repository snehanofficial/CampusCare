import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: env.NODE_ENV
  }
});
