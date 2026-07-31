import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger.js";

// Avoid instantiating multiple PrismaClient connections in development (which causes connection exhaustion)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "info" },
      { emit: "event", level: "warn" },
      { emit: "event", level: "error" }
    ]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Log queries and updates through our centralized Pino logger
prisma.$on("query" as any, (e: any) => {
  logger.debug({ query: e.query, params: e.params, duration: `${e.duration}ms` }, "Prisma Query executed");
});

prisma.$on("info" as any, (e: any) => {
  logger.info(e.message);
});

prisma.$on("warn" as any, (e: any) => {
  logger.warn(e.message);
});

prisma.$on("error" as any, (e: any) => {
  logger.error(e.message);
});
