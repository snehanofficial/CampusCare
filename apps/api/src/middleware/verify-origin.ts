import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const allowedOrigins = new Set(
  env.CORS_ORIGIN.split(",").map((origin) => origin.trim().toLowerCase())
);

export function verifyOrigin(req: Request, res: Response, next: NextFunction): void {
  // Safe idempotent methods do not change state
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Determine the request origin
  const originHeader = req.headers.origin;
  const refererHeader = req.headers.referer;

  let requestOrigin: string | null = null;

  if (originHeader) {
    try {
      requestOrigin = new URL(originHeader).origin.toLowerCase();
    } catch {
      requestOrigin = originHeader.toLowerCase();
    }
  } else if (refererHeader) {
    try {
      requestOrigin = new URL(refererHeader).origin.toLowerCase();
    } catch {
      requestOrigin = null;
    }
  }

  // If request origin is present, ensure it matches allowedOrigins
  if (requestOrigin) {
    if (allowedOrigins.has(requestOrigin)) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: {
        code: "CSRF_ORIGIN_INVALID",
        message: "Cross-origin request rejected: Untrusted origin.",
        requestId: (req as any).id,
      },
    });
    return;
  }

  // In production, browser state-changing requests MUST include Origin or Referer
  if (env.NODE_ENV === "production") {
    // If an Authorization header is provided (e.g. bearer token mobile/CLI client), allow
    if (req.headers.authorization) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: {
        code: "CSRF_ORIGIN_MISSING",
        message: "Cross-origin request rejected: Missing Origin header on state-changing request.",
        requestId: (req as any).id,
      },
    });
    return;
  }

  // In development/test mode, allow non-browser test scripts or curl if origin is absent
  next();
}
