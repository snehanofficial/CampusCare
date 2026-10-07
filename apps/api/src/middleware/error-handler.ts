import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { z } from "zod";
import { Prisma } from "@prisma/client";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const reqId = (req as any).id || (req.headers["x-request-id"] as string) || undefined;

  // Log the exception
  logger.error({
    msg: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id,
    requestId: reqId
  });

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId: reqId
      }
    });
    return;
  }

  // Handle Zod schemas validation errors
  if (err instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: err.flatten().fieldErrors,
        requestId: reqId
      }
    });
    return;
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        error: {
          code: "CONFLICT",
          message: "A record with these details already exists",
          requestId: reqId
        }
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "The requested record was not found",
          requestId: reqId
        }
      });
      return;
    }
  }

  // Fallback to internal server error
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred on the server",
      requestId: reqId
    }
  });
}
