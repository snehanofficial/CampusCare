import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { prisma } from "./database/prisma.js";
import {
  startPrivilegeScheduler,
  stopPrivilegeScheduler,
} from "./modules/privileges/privileges.scheduler.js";

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(`🚀 CampusCare API running on http://${env.HOST}:${env.PORT}`);
  logger.info(`📖 Interactive API reference on http://${env.HOST}:${env.PORT}/reference`);
  startPrivilegeScheduler();
});

const gracefulShutdown = () => {
  logger.info("Shutting down API server gracefully...");
  stopPrivilegeScheduler();
  server.close(async () => {
    logger.info("HTTP connections closed successfully.");
    try {
      await prisma.$disconnect();
      logger.info("Database client disconnected.");
      process.exit(0);
    } catch (err) {
      logger.error(err instanceof Error ? err : { err }, "Error disconnecting database client:");
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error("Force shut down because connections did not close in time.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
