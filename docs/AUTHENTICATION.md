# AUTHENTICATION.md
## CampusCare — Authentication Architecture

> **Status:** Phase 1 Implementation Reference  
> **Stack:** Express 5 · Prisma 7 · JWT · Refresh Token Rotation · HttpOnly Cookies  
> **Versions:** `jsonwebtoken@9.0.3` · `bcrypt@6.0.0` · `cookie-parser@1.4.7`

---

## 1. Purpose

This document defines the complete authentication architecture for CampusCare. It covers the Login/Logout lifecycle, JWT access token issuance, Refresh Token Rotation with reuse detection, HttpOnly cookie transport, and Session Restore on page load.

Authentication is the foundation every other module depends on. It must be correct, secure, and complete before any business module is built.

---

## 2. Architecture Overview

```
Client (Browser)
     │
     │  POST /api/v1/auth/login   { email, password }
     ▼
[Express Router] → [Zod Validation Middleware]
     │
     ▼
[Auth Controller]
     │
     ▼
[Auth Service]
     │  1. Find user by email (Prisma)
     │  2. bcrypt.compare(password, hash)
     │  3. Generate accessToken (JWT, 15m)
     │  4. Generate refreshToken (crypto.randomUUID)
     │  5. Hash refreshToken → store in DB (RefreshToken table)
     │  6. Set refreshToken in HttpOnly cookie
     │  7. Return { user, accessToken } in response body
     ▼
[Prisma — PostgreSQL]
```

### Token Lifecycle

```
Access Token (AT)  → In-memory (React state / AuthContext)
                   → 15 minutes TTL
                   → Sent in Authorization: Bearer <token>

Refresh Token (RT) → HttpOnly Secure SameSite=Strict cookie
                   → 7 days TTL
                   → Stored as hash in `refresh_tokens` table
                   → Rotated on every use
```

---

## 3. Security Decisions & Rationale

### 3.1 Access Token Storage: Memory (Not localStorage)

**Decision:** Store access tokens in React `AuthContext` (in-memory), not `localStorage` or `sessionStorage`.

**Why:**
- `localStorage` is accessible by any JavaScript on the page → XSS vulnerability
- In-memory tokens are destroyed on tab close, reducing attack surface
- The refresh token in HttpOnly cookie silently restores the session on page load

**Trade-off:** The access token is lost on page refresh. This is resolved via the Session Restore flow (see §6).

### 3.2 Refresh Token Storage: HttpOnly Cookie

**Decision:** Refresh tokens are sent and received only via HttpOnly cookies, never exposed in the response body.

**Configuration:**
```typescript
res.cookie("refreshToken", rawToken, {
  httpOnly: true,      // Not accessible via document.cookie (XSS protection)
  secure: process.env.NODE_ENV === "production",  // HTTPS only in production
  sameSite: "strict",  // Prevents CSRF attacks
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: "/api/v1/auth" // Scope cookie to auth endpoints only
});
```

**Why `SameSite=Strict`:** CampusCare is a same-origin application (frontend served from the same domain as the API in production). Strict mode prevents the browser from sending the cookie on cross-site requests.

### 3.3 Refresh Token Rotation with Reuse Detection

**Decision:** On every `/refresh` call, the old refresh token is invalidated and a new one is issued. If a previously-invalidated token is presented, all tokens for that user are revoked (token family invalidation).

**Why:** Token rotation limits the window of exploitation. Reuse detection catches compromised tokens immediately.

### 3.4 Database-Backed Refresh Tokens (Stateful)

**Decision:** Refresh tokens are stored in the database (not purely stateless JWTs).

**Why:**
- Allows instant revocation (logout, security breach)
- Enables reuse detection
- Supports "logout all devices"
- `jti` claim alone (stateless) cannot support these features

**Trade-off:** Database read on every refresh. Mitigated by indexing on `tokenHash` and `userId`.

### 3.5 Password Hashing: bcrypt with cost factor 12

**Decision:** Use `bcrypt` with `saltRounds: 12`.

**Why:** bcrypt is the industry standard for password hashing. Cost factor 12 is the 2025 recommended baseline — slow enough to resist brute force, fast enough for login (~300ms on modern hardware).

---

## 4. Prisma Schema — Session Model

The `schema.prisma` uses a `Session` model (replacing the simpler `RefreshToken` concept) to support full device tracking, per-device logout, and security auditing.

```prisma
model Session {
  id             String    @id @default(uuid()) @map("id")
  userId         String    @map("user_id")
  tokenHash      String    @unique @map("token_hash")  // SHA-256 hash of the raw refresh token
  deviceName     String?   @map("device_name")         // e.g., "iPhone 15", "Chrome on Windows"
  deviceType     String?   @map("device_type")         // "mobile" | "tablet" | "desktop" | "unknown"
  browser        String?   @map("browser")             // e.g., "Chrome 120"
  os             String?   @map("os")                  // e.g., "Windows 11"
  ipAddress      String?   @map("ip_address")
  userAgent      String?   @map("user_agent")          // Full UA string for debugging
  lastActivity   DateTime  @default(now()) @map("last_activity")
  expiresAt      DateTime  @map("expires_at")
  revoked        Boolean   @default(false) @map("revoked")
  revokedAt      DateTime? @map("revoked_at")
  revokedReason  String?   @map("revoked_reason")      // "LOGOUT" | "SECURITY" | "EXPIRED" | "REUSE_DETECTED"
  createdAt      DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([tokenHash])
  @@index([revoked])
  @@map("sessions")
}
```

### Device Information Extraction

Device metadata is extracted from the HTTP `User-Agent` header at login time using the `ua-parser-js` library:

```typescript
import { UAParser } from "ua-parser-js";

function parseUserAgent(userAgent: string) {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  return {
    browser: `${result.browser.name ?? "Unknown"} ${result.browser.version ?? ""}`.trim(),
    os: `${result.os.name ?? "Unknown"} ${result.os.version ?? ""}`.trim(),
    deviceType: (result.device.type ?? "desktop") as "mobile" | "tablet" | "desktop",
    deviceName: result.device.model ?? result.os.name ?? "Unknown Device",
  };
}
```

### Session Management Capabilities

| Feature | Endpoint | Description |
|:---|:---|:---|
| List active sessions | `GET /auth/sessions` | Returns all non-revoked sessions for current user |
| Revoke a session | `DELETE /auth/sessions/:sessionId` | Logout from a specific device |
| Revoke all sessions | `DELETE /auth/sessions` | Logout from all devices |
| Current session | Included in `GET /auth/me` | `sessionId` in response |

---

## 5. API Endpoints

### POST `/api/v1/auth/login`
**Request:**
```json
{ "email": "user@campus.edu", "password": "password123" }
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "firstName": "...", "lastName": "...", "role": "STUDENT" },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
**Side Effect:** `Set-Cookie: refreshToken=<raw>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`

### POST `/api/v1/auth/refresh`
**Request:** Sends the `refreshToken` cookie automatically.  
**Response (200):**
```json
{
  "success": true,
  "data": { "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
}
```
**Side Effect:** Old cookie cleared. New `refreshToken` cookie set.

### POST `/api/v1/auth/logout`
**Request:** Sends the `refreshToken` cookie automatically.  
**Response (204):** No content.  
**Side Effect:** Token marked as `revoked: true` in DB. Cookie cleared.

### POST `/api/v1/auth/register`
**Request:**
```json
{ "email": "...", "password": "...", "firstName": "...", "lastName": "..." }
```
**Response (201):** User created. Does NOT auto-login (explicit login required for security).

### GET `/api/v1/auth/me`
**Request:** `Authorization: Bearer <accessToken>`  
**Response (200):** Returns the authenticated user's profile and permissions.

---

## 6. Session Restore Flow

When the user refreshes the page, the in-memory access token is lost. The application must restore the session silently.

```
App Bootstrap (React)
     │
     ▼
AuthContext.init()
     │  1. Check if accessToken exists in memory → Skip if yes
     │
     ▼
Call GET /api/v1/auth/refresh
     │  (Cookie is sent automatically by browser)
     │
     ├── 200: Got new accessToken
     │         → Store in AuthContext
     │         → Set user state
     │         → Mark session as "authenticated"
     │
     └── 401: No valid cookie / Expired
               → Mark session as "unauthenticated"
               → Redirect to /login
```

**Implementation:** This logic lives in `useAuth()` hook and runs at app mount inside `AuthProvider`.

---

## 7. JWT Payload Structure

### Access Token Payload
```typescript
interface AccessTokenPayload {
  sub: string;           // userId
  email: string;
  role: string;          // e.g. "STUDENT", "TECHNICIAN"
  permissions: string[]; // e.g. ["tickets:create", "tickets:read_own"]
  iat: number;
  exp: number;
}
```

**Why include permissions in the JWT?** Avoids a DB query on every authenticated API request. Permissions rarely change. If they do, the token rotates within 15 minutes.

**Security Note:** Never include sensitive data (password hash, financial info) in the JWT payload. Payloads are base64-encoded, not encrypted.

### Refresh Token Structure
The refresh token is an opaque `crypto.randomUUID()` string — not a JWT. Opaque tokens:
- Cannot be decoded by the client
- Have no embedded expiry exploitable without DB check
- Are trivially revocable

---

## 8. Backend Implementation Details

### Auth Service — Key Methods

```typescript
// auth.service.ts
export class AuthService {
  // Login: validate credentials, issue tokens
  static async login(input: LoginInput): Promise<LoginResult>

  // Refresh: rotate refresh token, issue new access token
  static async refresh(rawRefreshToken: string): Promise<RefreshResult>

  // Logout: revoke refresh token
  static async logout(rawRefreshToken: string): Promise<void>

  // Register: create user with default STUDENT role
  static async register(input: RegisterInput): Promise<RegisterResult>

  // Me: return authenticated user profile with permissions
  static async getMe(userId: string): Promise<UserProfile>

  // Internal: hash token for DB storage
  private static hashToken(rawToken: string): string // SHA-256

  // Internal: revoke all tokens for a user (security breach response)
  static async revokeAllUserTokens(userId: string): Promise<void>
}
```

### Authenticate Middleware

```typescript
// middleware/authenticate.ts
export async function authenticate(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7);
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

  // Attach user context to request
  req.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    permissions: payload.permissions,
  };

  next();
}
```

**Express 5 Note:** In Express 5, async middleware errors thrown with `throw` propagate to error handlers automatically — no need for `try/catch` + `next(err)` in middleware.

---

## 9. Frontend Implementation Details

### AuthContext State

```typescript
// features/auth/store/auth.context.tsx
interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: "loading" | "authenticated" | "unauthenticated";
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

### Token Storage Strategy

| Storage | Token Type | Reason |
|---------|-----------|--------|
| React Context (memory) | Access Token | XSS-safe, cleared on tab close |
| HttpOnly Cookie | Refresh Token | XSS-safe, CSRF-safe, auto-sent by browser |
| Never in localStorage | Neither | XSS vulnerability |

---

## 10. Security Checklist

- [ ] Access tokens expire in ≤ 15 minutes
- [ ] Refresh tokens stored as SHA-256 hash in DB (never plaintext)
- [ ] Refresh token cookie: `HttpOnly=true`, `Secure=true` (prod), `SameSite=Strict`
- [ ] Cookie path scoped to `/api/v1/auth`
- [ ] Refresh token rotated on every use
- [ ] Reuse detection triggers full user session revocation
- [ ] bcrypt cost factor ≥ 12
- [ ] JWT signed with HS256 minimum (RS256 if multi-service in future)
- [ ] No sensitive data in JWT payload
- [ ] Rate limiting on `/auth/login` and `/auth/refresh`
- [ ] HTTPS enforced in production

---

## 11. Error Codes

| Scenario | HTTP Status | Error Code |
|----------|-------------|-----------|
| Invalid credentials | 401 | `INVALID_CREDENTIALS` |
| Expired access token | 401 | `TOKEN_EXPIRED` |
| Invalid refresh token | 401 | `INVALID_REFRESH_TOKEN` |
| Revoked refresh token | 401 | `TOKEN_REVOKED` |
| Token reuse detected | 401 | `TOKEN_REUSE_DETECTED` |
| Email already registered | 400 | `EMAIL_ALREADY_EXISTS` |
| Account disabled | 403 | `ACCOUNT_DISABLED` |

---

## 12. Future Extensibility

- **OAuth / SSO:** The `AuthService` abstraction allows adding OAuth providers (Google, Microsoft) without changing the controller layer. Add an `oauth.service.ts` alongside the existing service.
- **MFA:** Can be added as a second step after password validation, before issuing tokens.
- **Device Fingerprinting:** Add `deviceId` to the `RefreshToken` record to detect cross-device token usage.
- **Redis Sessions:** For extremely high-scale deployments, replace DB-backed refresh tokens with Redis for sub-millisecond lookup. The service interface remains identical.
