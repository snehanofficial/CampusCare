import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import swaggerJSDoc from "swagger-jsdoc";
import { apiReference } from "@scalar/express-api-reference";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { apiRouter } from "./modules/index.js";
import { errorHandler } from "./middleware/error-handler.js";

export const app = express();

// 1. Logger middleware
app.use(pinoHttp({ logger }));

// 2. Global Security & Performance Middlewares
app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "https://cdn.jsdelivr.net"],
        "img-src": ["'self'", "data:", "https://cdn.jsdelivr.net"], // Scalar may also load assets/images
      },
    },
  }) as any);
app.use(cors({
  origin: env.NODE_ENV === "production" ? false : true, // Adjust in production
  credentials: true
}));
app.use(compression());
app.use(cookieParser(env.JWT_ACCESS_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Swagger JSDoc Setup
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CampusCare API Documentation",
      version: "1.0.0",
      description: "API specifications for CampusCare Help Desk & IT Service Management Platform."
    },
    servers: [
      {
        url: `http://${env.HOST}:${env.PORT}`,
        description: "Development Server"
      }
    ]
  },
  apis: ["./src/modules/**/*.routes.ts", "./src/modules/**/*.ts"]
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// 4. API Docs Route (Scalar)
app.use(
  "/reference",
  apiReference({
    spec: {
      content: swaggerSpec
    },
    theme: "purple",
    darkMode: true
  })
);

// Serve OpenAPI JSON definition raw
app.get("/swagger.json", (req, res) => {
  res.json(swaggerSpec);
});

// 5. Mount API Version v1 Routes
app.use("/api/v1", apiRouter);

// 6. 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Cannot ${req.method} ${req.path}`
    }
  });
});

// 7. Global Exception Handler
app.use(errorHandler);
