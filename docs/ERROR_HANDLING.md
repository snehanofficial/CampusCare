# ERROR_HANDLING.md
## CampusCare — Error Handling Architecture

> **Status:** Phase 1 Implementation Reference  
> **Stack:** Express 5 · Pino · Zod · TanStack Query · Sonner · React Error Boundaries

---

## 1. Purpose

This document defines the error handling strategy for CampusCare across both the backend (Express API) and frontend (React). The goal is:
1. **Backend:** All errors are caught, logged with context, and returned in a consistent envelope
2. **Frontend:** All errors are handled gracefully — users always see a meaningful message, never a crash or raw stack trace

---

## 2. Error Classification

### Backend Errors

| Category | Examples | HTTP Status |
|:---|:---|:---|
| **Validation Error** | Invalid input body | 400 |
| **Authentication Error** | No token, expired token | 401 |
| **Authorization Error** | Missing permission | 403 |
| **Not Found Error** | Resource doesn't exist | 404 |
| **Conflict Error** | Duplicate email | 409 |
| **Business Logic Error** | SLA already closed | 422 |
| **Rate Limit Error** | Too many requests | 429 |
| **Internal Server Error** | DB connection failed | 500 |

### Frontend Errors

| Category | Examples | Handling |
|:---|:---|:---|
| **API Error** | 4xx/5xx from API | Toast notification |
| **Network Error** | No internet, timeout | Toast + retry |
| **Auth Error** | 401 → auto-refresh → if fails, redirect | Silent or redirect |
| **Form Validation** | Zod schema failure | Inline field errors |
| **React Render Error** | Component crash | Error Boundary |
| **Route Error** | No route match | 404 page |

---

## 3. Backend: Custom Error Classes

```typescript
// apps/api/src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: unknown) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super("Validation failed", 400, "VALIDATION_ERROR", details);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super("Too many requests. Please try again later.", 429, "RATE_LIMIT_EXCEEDED");
  }
}
```

---

## 4. Backend: Global Error Handler Middleware

```typescript
// apps/api/src/middleware/error-handler.ts
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { logger } from "../utils/logger.js";
import { AppError, ValidationError, ConflictError } from "../utils/errors.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log all errors with request context
  logger.error({
    err,
    req: {
      method: req.method,
      url: req.url,
      userId: req.user?.id,  // If authenticated
    },
  }, "Request error");

  // 1. Known application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // 2. Zod validation errors (from .parse() without middleware)
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  // 3. Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      // Unique constraint violation
      res.status(409).json({
        success: false,
        error: {
          code: "CONFLICT",
          message: "A record with these details already exists",
        },
      });
      return;
    }
    if (err.code === "P2025") {
      // Record not found
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "The requested record was not found",
        },
      });
      return;
    }
  }

  // 4. Unknown errors — never expose internal details
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred. Please try again.",
      // No stack traces, no err.message from unknown errors
    },
  });
}
```

**Express 5 Note:** In Express 5, async route handlers that throw are automatically passed to the next error handler. No need to wrap everything in `try/catch` + `next(err)`. However, controllers still use try/catch for explicit control over error transformation.

---

## 5. Backend: Pino Logger Configuration

```typescript
// apps/api/src/utils/logger.ts
import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "warn" : "debug",
  transport: env.NODE_ENV === "development"
    ? { target: "pino-pretty", options: { colorize: true, translateTime: true } }
    : undefined, // JSON output in production (for log aggregators)
  redact: {
    paths: ["req.headers.authorization", "req.body.password", "*.passwordHash"],
    censor: "[REDACTED]",
  },
  base: {
    pid: false,       // Remove process ID (not useful in serverless/container)
    hostname: false,  // Remove hostname (add at infrastructure level)
  },
  serializers: {
    err: pino.stdSerializers.err,  // Serialize Error objects properly
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});
```

**Pino-HTTP integration:**
```typescript
app.use(pinoHttp({
  logger,
  customLogLevel: (req, res) => {
    if (res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  // Skip health checks from logs
  autoLogging: {
    ignore: (req) => req.url === "/health",
  },
}));
```

---

## 6. Frontend: API Error Normalization

See [API_CLIENT.md](./API_CLIENT.md) §7. The `normalizeError` function converts Axios errors into a consistent `AppError` shape:

```typescript
export interface AppError {
  code: string;       // Machine-readable: "INVALID_CREDENTIALS"
  message: string;    // Human-readable: "Invalid email or password"
  status: number;     // HTTP status code
  details?: unknown;  // Field-level validation errors
}
```

---

## 7. Frontend: Error Toast Pattern

All API errors surface to the user via Sonner toasts:

```typescript
// Standard mutation error handling
const mutation = useMutation({
  mutationFn: api.createTicket,
  onSuccess: () => toast.success("Ticket created successfully"),
  onError: (error: AppError) => {
    if (error.status === 403) {
      toast.error("You don't have permission to create tickets");
    } else {
      toast.error(error.message); // Use server's human-readable message
    }
  },
});
```

**Rules:**
- 400 errors: Show field-level errors inline (via `setError`) + optional toast
- 401 errors: Never show toast (Axios interceptor handles redirect silently)
- 403 errors: Toast "You don't have permission to..."
- 404 errors: Navigate to 404 page or show inline empty state
- 429 errors: Toast "Too many requests. Please try again in a moment."
- 500 errors: Toast with generic message

---

## 8. Frontend: React Error Boundaries

```tsx
// app/guards/ErrorBoundary.tsx
import { Component, ErrorInfo } from "react";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to monitoring service in production
    console.error("React Error Boundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground">
            An unexpected error occurred in this section.
          </p>
          <Button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Placement:** Wrap each major section (page content, sidebar, dashboard widget) independently so one error doesn't crash the entire app.

---

## 9. Frontend: Route Error Boundary

```tsx
// app/guards/RouteErrorBoundary.tsx
import { useRouteError, isRouteErrorResponse, Link } from "react-router";

export function RouteErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-4xl font-bold text-muted-foreground">
          {error.status}
        </h1>
        <p className="text-lg">{error.statusText}</p>
        <Link to="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-semibold">Unexpected Error</h1>
      <p className="text-muted-foreground">Something went wrong. Please try again.</p>
      <Link to="/dashboard"><Button>Go to Dashboard</Button></Link>
    </div>
  );
}
```

---

## 10. TanStack Query Error Handling

```typescript
// Global error handler for all queries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: AppError) => {
        if (error.status === 401 || error.status === 403) return false;
        return failureCount < 2;
      },
      throwOnError: false, // Don't throw to Error Boundary by default
    },
  },
});

// Per-query error handling
const { error } = useQuery({
  queryKey: ticketKeys.list({}),
  queryFn: ticketsApi.getAll,
  throwOnError: true, // Use Error Boundary for this specific query
});
```

---

## 11. 404 and 403 Pages

```tsx
// features/errors/pages/NotFoundPage.tsx
export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link to="/dashboard"><Button>Back to Dashboard</Button></Link>
    </div>
  );
}

// features/errors/pages/ForbiddenPage.tsx
export function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">403</p>
        <h1 className="mt-2 text-3xl font-semibold">Access denied</h1>
        <p className="mt-2 text-muted-foreground">
          You don't have permission to view this page.
          Contact your administrator if you believe this is an error.
        </p>
      </div>
      <Link to="/dashboard"><Button variant="outline">Go to Dashboard</Button></Link>
    </div>
  );
}
```

---

## 12. Error Handling Checklist

**Backend:**
- [ ] All custom error classes extend `AppError`
- [ ] Zod errors caught and formatted consistently
- [ ] Prisma errors (P2002, P2025) handled without exposing DB details
- [ ] Generic 500 for unknown errors (no stack traces)
- [ ] Pino logger redacts sensitive fields (password, tokens)
- [ ] All error responses follow `{ success: false, error: { code, message } }` envelope

**Frontend:**
- [ ] Axios response interceptor normalizes all errors to `AppError`
- [ ] 401 errors trigger silent refresh (not toast)
- [ ] Mutation `onError` handlers show appropriate toast messages
- [ ] React Error Boundary wraps major sections
- [ ] Route Error Boundary on protected routes
- [ ] 404 and 403 pages implemented
- [ ] Form errors surfaced via `setError` (not just toast)
