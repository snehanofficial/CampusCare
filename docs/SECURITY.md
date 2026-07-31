# SECURITY.md
## CampusCare — Security Architecture

> **Status:** Phase 1 Implementation Reference  
> **Stack:** Express 5 · Helmet · CORS · Rate Limiting · JWT · HttpOnly Cookies · Zod · bcrypt

---

## 1. Purpose

This document is the security architecture reference for CampusCare. It covers the defense-in-depth strategy applied across the API layer, authentication system, frontend, and database.

---

## 2. Threat Model

CampusCare is an internal campus IT management system. Threats include:

| Threat | Vector | Mitigation |
|:---|:---|:---|
| XSS (Cross-Site Scripting) | Malicious scripts accessing tokens | HttpOnly cookies, CSP headers, no `dangerouslySetInnerHTML` |
| CSRF (Cross-Site Request Forgery) | Forged requests using victim's cookies | `SameSite=Strict` cookie flag, CORS restrictions |
| Credential Theft | Brute force, credential stuffing | Rate limiting, bcrypt, account lockout (Phase 2) |
| Token Theft | Intercepted tokens | Short-lived JWTs (15m), HTTPS only |
| Session Fixation | Reuse of old session tokens | Refresh token rotation with reuse detection |
| SQL Injection | Malicious SQL in inputs | Prisma parameterized queries (inherent protection) |
| IDOR | Accessing other users' resources | Permission checks at service layer, never trust client-provided IDs alone |
| Denial of Service | Flooding the API | Rate limiting per IP and per route |
| Path Traversal | Accessing files via `../` | Multer safe filename handling, stored outside web root |
| Open Redirect | Redirect to malicious URL | Validate redirect URLs against allowlist |

---

## 3. HTTP Security Headers (Helmet)

```typescript
// apps/api/src/app.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],  // Scalar API docs
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'none'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for Scalar API docs
  hsts: {
    maxAge: 31536000,  // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xContentTypeOptions: true,          // X-Content-Type-Options: nosniff
  xFrameOptions: { action: "deny" }, // X-Frame-Options: DENY (clickjacking)
  xXssProtection: true,              // Legacy X-XSS-Protection header
}));
```

---

## 4. CORS Configuration

```typescript
// Production-ready CORS
const ALLOWED_ORIGINS = process.env.NODE_ENV === "production"
  ? ["https://campuscare.yourschool.edu"]
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,       // Required for HttpOnly cookie exchange
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: [],
  maxAge: 86400,           // Preflight cache: 24 hours
}));
```

**Why `credentials: true`?** The browser requires `credentials: true` on the CORS response for the browser to send and receive `Set-Cookie` headers on cross-origin requests (development scenario where frontend at port 5173 talks to API at port 3000).

---

## 5. Rate Limiting

```typescript
// middleware/rate-limit.ts
import rateLimit from "express-rate-limit";

// General API rate limit
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // 200 requests per window per IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests. Please try again later." }
  },
});

// Strict rate limit for auth endpoints (brute force protection)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // Only 10 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "AUTH_RATE_LIMIT_EXCEEDED", message: "Too many login attempts. Try again in 15 minutes." }
  },
});

// File upload rate limit
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,                   // 50 uploads per hour per IP
});
```

**Application:**
```typescript
app.use("/api/v1", generalRateLimit);
app.use("/api/v1/auth/login", authRateLimit);
app.use("/api/v1/auth/refresh", authRateLimit);
app.use("/api/v1/uploads", uploadRateLimit);
```

---

## 6. Input Validation (Zod)

All request bodies are validated against Zod schemas before reaching the controller:

```typescript
// middleware/validate.ts
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: result.error.flatten().fieldErrors,
        },
      });
      return;
    }
    req.body = result.data; // Use Zod-parsed (sanitized) data only
    next();
  };
}
```

**Never trust `req.body` directly in controllers** — always route through the `validate` middleware.

---

## 7. Password Security

```typescript
// Configuration
const BCRYPT_SALT_ROUNDS = 12; // 2025 recommended minimum

// Hashing
const hashedPassword = await bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);

// Verification — always use compare, never decrypt
const isValid = await bcrypt.compare(plainPassword, storedHash);
```

**Rules:**
- Minimum password length: 8 characters (enforced by Zod schema)
- Maximum password length: 72 characters (bcrypt limit; truncate silently or reject explicitly)
- No maximum attempt lockout in Phase 1 — rate limiting provides sufficient protection
- Never log passwords or store them in plaintext anywhere (including logs)

---

## 8. JWT Security

```typescript
// Access token: HS256 with a 256-bit secret (min 32 characters)
const accessToken = jwt.sign(
  payload,
  env.JWT_ACCESS_SECRET,          // Min 32 chars, cryptographically random
  {
    expiresIn: "15m",
    algorithm: "HS256",
    issuer: "campuscare-api",
    audience: "campuscare-web",
  }
);

// Verification: always verify algorithm explicitly
const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
  algorithms: ["HS256"],          // Never allow "none" algorithm
  issuer: "campuscare-api",
  audience: "campuscare-web",
}) as AccessTokenPayload;
```

**Key Rotation:** If `JWT_ACCESS_SECRET` is compromised:
1. Change the secret in environment variables
2. All existing access tokens immediately become invalid (they fail `jwt.verify`)
3. Users must re-authenticate via refresh token
4. If refresh tokens are also compromised, call `revokeAllUserTokens()`

---

## 9. Cookie Security

```typescript
// Refresh token cookie — maximum security flags
res.cookie("refreshToken", rawToken, {
  httpOnly: true,            // Not accessible via document.cookie
  secure: NODE_ENV === "production", // HTTPS only in production
  sameSite: "strict",        // Never sent on cross-site requests (CSRF protection)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/api/v1/auth",      // Only sent to auth endpoints
  // domain: ".campuscare.edu", // Uncomment in production for subdomain sharing
});
```

---

## 10. File Upload Security (Multer)

```typescript
// middleware/upload.ts
import multer from "multer";
import path from "path";
import crypto from "crypto";

const storage = multer.diskStorage({
  destination: "./storage/uploads/",
  filename: (req, file, cb) => {
    // Generate random filename to prevent path traversal and file overwrite
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,  // 10MB max
    files: 5,                     // Max 5 files per request
  },
  fileFilter: (req, file, cb) => {
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});
```

**Never serve uploaded files directly via Express** — use a CDN or a file server with its own security controls in production. For development, serve from a `/storage/uploads/` route with content-type header validation.

---

## 11. SQL Injection Protection

Prisma ORM uses parameterized queries for all database operations. SQL injection via Prisma's standard API is not possible.

**Never use `prisma.$queryRawUnsafe()`** unless absolutely necessary. If raw SQL is needed, always use `prisma.$queryRaw` with template literals (which Prisma parameterizes):

```typescript
// ✅ Safe — Prisma parameterizes template literals
const result = await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userInput}`;

// ❌ Never — direct string interpolation
const result = await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${userInput}'`);
```

---

## 12. Sensitive Data Exclusion

**Never return these fields in API responses:**
- `passwordHash`
- `refreshToken` records
- Internal audit metadata not relevant to the requester
- Other users' private information beyond what RBAC permits

```typescript
// Always use Prisma's `select` or `omit` to exclude sensitive fields
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: { select: { name: true } },
    // passwordHash is NOT selected
  },
});
```

---

## 13. Error Handling Security

**Never expose internal errors to the client:**

```typescript
// middleware/error-handler.ts
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log full error internally (with stack trace)
  logger.error({ err }, "Unhandled error");

  // Return sanitized error to client
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }

  // For unknown errors, return generic 500
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      // Never expose: err.message, err.stack, database errors, file paths
      message: "An unexpected error occurred. Please try again.",
    },
  });
});
```

---

## 14. Environment Variables Security

```
# Required secrets (never commit to git)
JWT_ACCESS_SECRET=<min 64 chars, cryptographically random>
JWT_REFRESH_SECRET=<min 64 chars, cryptographically random, DIFFERENT from access>
DATABASE_URL=postgresql://...
VAPID_PRIVATE_KEY=...

# .env is in .gitignore
# Use .env.example for documentation (no real values)
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 15. Audit Logging

All security-relevant actions must be logged to the `AuditLog` table:

| Action | When |
|:---|:---|
| `AUTH_LOGIN` | On successful login |
| `AUTH_LOGOUT` | On explicit logout |
| `AUTH_REFRESH` | On token refresh |
| `AUTH_TOKEN_REUSE` | When a revoked token is presented |
| `USER_CREATED` | On registration |
| `PERMISSION_GRANT` | When a UserPermission override is created |
| `PERMISSION_REVOKE` | When an override is removed |

---

## 16. Security Checklist (Phase 1)

- [ ] Helmet middleware with strict CSP
- [ ] CORS restricted to known origins
- [ ] Rate limiting on all auth endpoints
- [ ] JWT secret ≥ 64 characters
- [ ] JWT algorithm explicitly set (`HS256`)
- [ ] Refresh tokens hashed in database (SHA-256)
- [ ] HttpOnly, Secure, SameSite=Strict cookies
- [ ] Zod validation on all API request bodies
- [ ] bcrypt with cost factor 12
- [ ] Prisma parameterized queries (never raw string interpolation)
- [ ] Sensitive fields excluded from API responses
- [ ] Generic 500 error messages (no stack traces to client)
- [ ] `.env` in `.gitignore`
- [ ] No `console.log` in production (use Pino logger)
- [ ] File uploads: random filenames, MIME type whitelist, size limits
