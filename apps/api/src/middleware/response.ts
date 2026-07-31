import { Response } from "express";

/**
 * Standardized success response envelope helper.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: any
): void {
  res.status(statusCode).json({
    success: true,
    data,
    ...(meta ? { meta } : {})
  });
}
