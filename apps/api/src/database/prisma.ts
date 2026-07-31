import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

// Setup pg Pool and PrismaPg Adapter for Prisma 7
const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

// Avoid instantiating multiple PrismaClient connections in development (which causes connection exhaustion)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
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
const prismaAny = prisma as any;
prismaAny.$on("query", (e: any) => {
  logger.debug({ query: e.query, params: e.params, duration: `${e.duration}ms` }, "Prisma Query executed");
});

prismaAny.$on("info", (e: any) => {
  logger.info(e.message);
});

prismaAny.$on("warn", (e: any) => {
  logger.warn(e.message);
});

prismaAny.$on("error", (e: any) => {
  logger.error(e.message);
});
