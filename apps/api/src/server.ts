import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { prisma } from "./database/prisma.js";
import { initNotificationListeners } from "./modules/notifications/notifications.events.js";
import { initServiceStatusListeners } from "./modules/service-status/service-status.events.js";
import { registerKnowledgeBaseEvents } from "./modules/knowledge-base/knowledge-base.events.js";

import { initSocketServer } from "./sockets/socket.server.js";

// Initialize domain event subscribers
initNotificationListeners();
initServiceStatusListeners();
registerKnowledgeBaseEvents();

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(`🚀 CampusCare API running on http://${env.HOST}:${env.PORT}`);
  logger.info(`📖 Interactive API reference on http://${env.HOST}:${env.PORT}/reference`);
});

// Start real-time Socket.IO server
initSocketServer(server);

const gracefulShutdown = () => {
  logger.info("Shutting down API server gracefully...");
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
