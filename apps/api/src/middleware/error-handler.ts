import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { z } from "zod";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the exception
  logger.error({
    msg: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
    return;
  }

  // Handle Zod schemas validation errors
  if (err instanceof z.ZodError) {
    res.status(422).json({
      success: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Request validation failed",
        details: err.flatten().fieldErrors
      }
    });
    return;
  }

  // Fallback to internal server error
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred on the server"
    }
  });
}
