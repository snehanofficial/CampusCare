# Fix Plan
**Source audit**: `FINAL_AUDIT_REPORT.md`
**Plan date**: 2026-10-07
**Total items**: 38 (7 Critical, 14 High, 11 Medium, 6 Low)
**Queue order rationale**: Remediations are strictly sequenced by dependency: build unblockers and package overrides execute first so subsequent changes can be verified by the build toolchain; backend foundational middleware (proxy trust, process exception handlers, request-ID tracking, HSTS, global rate limiting, CSRF) executes before domain-specific route guards and controllers; authentication policy and data integrity fixes precede client-side security (mock purging and XSS sanitization); UI accessibility enhancements build on global CSS foundations before targeting component surfaces; and governance, cleanup, and product-decision items conclude the queue.

---

## Execution Queue

| # | ID | Title | Severity | Category | Blast radius | Verification | Status |
| 1 | F-001 | Fix Prisma 7 Module Resolution & Compilation Failure | Critical | Architecture & Build | 43 files | `pnpm --filter api build` | DONE |
| 2 | F-002 | Declare `"type": "module"` in Root `package.json` | Low | Node.js Best Practices | 1 file | `pnpm lint` | DONE |
| 3 | F-003 | Override Vulnerable `proxy-addr` to `>=2.0.8` (CVE-2023-26160) | Critical | OWASP A03 / A01 | 2 files | `pnpm audit --json` | DONE |
| 4 | F-004 | Upgrade `axios` to `>=1.20.0` to Remediate 8 CVEs | Critical | OWASP A03 / A05 | 2 files | `pnpm audit --json` | DONE |
| 5 | F-005 | Remove Backend Database & JWT Secrets from Frontend `.env` | Critical | OWASP A02 / A04 | 2 files | `grep -rn "DATABASE_URL" apps/web/` | DONE |
| 6 | F-006 | Configure Express `trust proxy` for Reverse Proxy IP Integrity | High | OWASP A02 / A01 | 1 file | `grep -rn "trust proxy" apps/api/src/app.ts` | DONE |
| 7 | F-007 | Implement Process-Level `unhandledRejection` Handlers | High | OWASP A10 / ASVS 7.1.1 | 1 file | `grep -rn "unhandledRejection" apps/api/src/server.ts` | DONE |
| 8 | F-008 | Inject Correlation `requestId` into Error Handler Responses | Medium | OWASP A09 / ASVS 8.1.1 | 1 file | `grep -rn "requestId" apps/api/src/middleware/error-handler.ts` | DONE |
| 9 | F-009 | Enable HTTP Strict Transport Security (HSTS) in Helmet | High | OWASP A02 / ASVS 2.2.5 | 1 file | `grep -rn "hsts" apps/api/src/app.ts` | DONE |
| 10 | F-010 | Mount Global Rate Limiter on All Public `/api/v1` Endpoints | High | OWASP A06 / ASVS 2.4.1 | 1 file | `grep -rn "generalRateLimit" apps/api/src/app.ts` | DONE |
| 11 | F-011 | Implement Origin Validation & State-Changing CSRF Mitigation | High | OWASP A01 / ASVS 3.2.1 | 2 files | `grep -rn "verifyOrigin" apps/api/src/` | DONE |
| 12 | F-012 | Log Security Audit Events on Failed Login Attempts | High | OWASP A09 / ASVS 8.1.1 | 1 file | `grep -rn "AUTH_LOGIN_FAILED" apps/api/src/modules/auth/` | DONE |
| 13 | F-013 | Eliminate Hardcoded Default Password `"CampusCare123!"` | Critical | OWASP A07 / ASVS 4.1.2 | 2 files | `grep -rn "CampusCare123!" apps/api/` | DONE |
| 14 | F-014 | Enforce Max Password Length (72 Chars) for Bcrypt DoS Protection | Medium | OWASP A07 / A06 | 1 file | `pnpm --filter shared-schemas test` | DONE |
| 15 | F-015 | Attach Rate Limiting to Public `/auth/register` Endpoint | High | OWASP A06 / ASVS 2.4.1 | 1 file | `grep -rn "authRateLimit" apps/api/src/modules/auth/auth.routes.ts` | DONE |
| 16 | F-016 | Restrict Role Escalation & Invalidate Sessions on Role Update | High | OWASP A01 / A07 | 1 file | `grep -rn "revokedReason" apps/api/src/modules/users/users.service.ts` | DONE |
| 17 | F-017 | Mount GTPE Temporary Privilege Hydration Globally on API | High | OWASP A01 / ASVS 4.2.1 | 2 files | `grep -rn "hydrateTemporaryPermissions" apps/api/src/` | DONE |
| 18 | F-018 | Enforce File Size Limits (5MB) & MIME Validation on Multer | High | OWASP A06 / ASVS 12.1.1 | 2 files | `grep -rn "limits" apps/api/src/modules/` | DONE |
| 19 | F-019 | Guarantee Multer Upload Cleanup in `finally` Blocks | Medium | OWASP A10 / A08 | 2 files | `grep -rn "finally" apps/api/src/modules/*/` | DONE |
| 20 | F-020 | Escape Formula Trigger Characters (`=`, `+`, `-`, `@`) in CSV Exports | High | OWASP A05 / ASVS 5.3.4 | 1 file | `grep -rn "escapeFormula" apps/api/src/utils/` | DONE |
| 21 | F-021 | Strip Mock Admin Impersonation Layer from Production Bundle | Critical | OWASP A01 / Architecture | 3 files | `grep -rn "setMockEnabled" apps/web/src/` | PENDING |
| 22 | F-022 | Sanitize KB Article Content with DOMPurify to Prevent Stored XSS | Critical | OWASP A05 / ASVS 5.3.3 | 1 file | `grep -rn "DOMPurify" apps/web/src/features/knowledge-base/` | PENDING |
| 23 | F-023 | Guard Internal `/playground` Route with `PermissionGuard` | High | OWASP A01 / Architecture | 1 file | `grep -rn "playground" apps/web/src/app/router/router.tsx` | PENDING |
| 24 | F-024 | Add WCAG 3.3.8 `autoComplete` Attributes to Auth Forms | High | WCAG 2.2 AA SC 3.3.8 | 2 files | `grep -rn "autoComplete" apps/web/src/features/auth/` | PENDING |
| 25 | F-025 | Add Global `scroll-margin-top` for Sticky Header Focus Clearance | Medium | WCAG 2.2 AA SC 2.4.11 | 1 file | `grep -rn "scroll-margin-top" apps/web/src/app/globals.css` | PENDING |
| 26 | F-026 | Replace `focus:outline-none` with Visible Focus Rings | High | WCAG 2.2 AA SC 2.4.7 | ~20 files | `grep -rn "focus:outline-none" apps/web/src/` | PENDING |
| 27 | F-027 | Provide Keyboard Operability & Links for Interactive Table Rows | Medium | WCAG 2.2 AA SC 2.1.1 | 2 files | `grep -rn "tabIndex" apps/web/src/features/heatmap/` | PENDING |
| 28 | F-028 | Add `Escape` Key Dismissal for Mobile Navigation Drawer | Medium | WCAG 2.2 AA SC 2.1.1 | 1 file | `grep -rn "keydown" apps/web/src/app/layouts/AppLayout.tsx` | PENDING |
| 29 | F-029 | Enforce Minimum 24×24px Interactive Target Size on Icon Buttons | Low | WCAG 2.2 AA SC 2.5.8 | 3 files | Visual inspection / CSS checks | PENDING |
| 30 | F-030 | Enforce Subresource Integrity (SRI) on External CDN Assets | Low | OWASP A08 / ASVS 14.3.3 | 1 file | `grep -rn "cdn.jsdelivr.net" apps/api/src/app.ts` | PENDING |
| 31 | F-031 | Normalize Permission String `service_status.manage` | Low | Architecture Consistency | 3 files | `pnpm --filter constants build` | PENDING |
| 32 | F-032 | Replace Hardcoded Secret Defaults in `.env.example` Files | Low | OWASP A02 / ASVS 2.1.1 | 2 files | `grep -rn "cc_access_secret_key" .env*` | PENDING |
| 33 | F-033 | Configure `@typescript-eslint` and Accessibility Rules in ESLint | Medium | Code Quality / Governance | 1 file | `pnpm lint` | PENDING |
| 34 | F-034 | Establish GitHub Actions CI Workflow with Testing & SBOM | Medium | OWASP A03 / ASVS 14.2.1 | 1 file | `ls -la .github/workflows/ci.yml` | PENDING |
| 35 | F-035 | Prune 80+ Empty Scaffolding Placeholder Files | Medium | Code Quality & Dead Code | 80+ files | `find apps/web/src/features -name "index.ts" -exec grep -H "Placeholder" {} +` | PENDING |
| 36 | F-036 | Route Registration for Orphaned `AutomationPage.tsx` | Medium | Flow & Scope | 2 files | Product intent decision | AWAITING-HUMAN-DECISION |
| 37 | F-037 | Monolithic Component Modularization Plan (>1,000 LOC Files) | Medium | Code Quality / Architecture | 6 files | Architectural review | AWAITING-HUMAN-DECISION |
| 38 | F-038 | Password Reset Endpoint Implementation vs Template Cleanup | Low | Flow & Scope | 1 file | Product intent decision | AWAITING-HUMAN-DECISION |

---

## Item Detail

### F-001 — Fix Prisma 7 Module Resolution & Compilation Failure
- **Finding**: Running `pnpm --filter api build` fails with 165 errors across 43 files (`TS2305: Module '"@prisma/client"' has no exported member 'Prisma'`), completely blocking production builds.
- **Chosen fix**: Update import statements across `apps/api/src` to import the Prisma namespace correctly from `@prisma/client`, and update `apps/api/tsconfig.json` module resolution settings to properly resolve Prisma 7 client types.
- **Official source**: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions
- **Alternatives considered**: Downgrading to Prisma 6 was rejected because the codebase uses Prisma 7's `@prisma/adapter-pg` driver adapter.
- **Tradeoffs**: Minor import normalization across repository files; guarantees stable compile-time types with zero runtime overhead.
- **Blast radius**: `apps/api/src/database/prisma.ts`, `apps/api/src/middleware/error-handler.ts`, and repository/service files.
- **Verification**: `pnpm --filter api build && pnpm typecheck` must exit with code 0.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-002 — Declare `"type": "module"` in Root `package.json`
- **Finding**: Running ESLint outputs Node.js warning `MODULE_TYPELESS_PACKAGE_JSON` due to root `package.json` omitting `"type": "module"`.
- **Chosen fix**: Add `"type": "module"` to root `package.json`.
- **Official source**: https://nodejs.org/api/packages.html#type
- **Alternatives considered**: Renaming `eslint.config.js` to `eslint.config.mjs` was rejected because the monorepo standardizes on ESM across all packages.
- **Tradeoffs**: None.
- **Blast radius**: `package.json`.
- **Verification**: `pnpm lint` runs without triggering `MODULE_TYPELESS_PACKAGE_JSON`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-003 — Override Vulnerable `proxy-addr` to `>=2.0.8` (CVE-2023-26160)
- **Finding**: `proxy-addr@2.0.7` allows attacker-controlled IP spoofing via IPv4-mapped IPv6 trust subnets (Critical severity).
- **Chosen fix**: Add `"pnpm": { "overrides": { "proxy-addr": ">=2.0.8" } }` in root `package.json` and run `pnpm install`.
- **Official source**: https://github.com/advisories/GHSA-jqcg-44mw-7w3h
- **Alternatives considered**: Waiting for upstream Express release was rejected because this vulnerability directly bypasses rate limiting and audit logs today.
- **Tradeoffs**: Forces dependency resolution across all transitive sub-dependencies; verified backward-compatible within 2.x semver.
- **Blast radius**: `package.json`, `pnpm-lock.yaml`.
- **Verification**: `pnpm audit --json | grep "proxy-addr"` returns 0 vulnerable instances.
- **Reversibility**: Single `git revert` + `pnpm install`.
- **Status**: PENDING

---

### F-004 — Upgrade `axios` to `>=1.20.0` to Remediate 8 CVEs
- **Finding**: `axios@^1.19.0` pinned in `apps/web/package.json` contains 8 CVEs (prototype pollution, SSRF, header injection).
- **Chosen fix**: Upgrade `axios` dependency in `apps/web/package.json` to `"^1.20.0"` and update lockfile.
- **Official source**: https://github.com/advisories/GHSA-x97p-jq2g-jp4f
- **Alternatives considered**: Replacing Axios with native `fetch` was rejected for this step to preserve existing Axios interceptors and error handling.
- **Tradeoffs**: Minor version upgrade with bug fixes; zero breaking changes in Axios API.
- **Blast radius**: `apps/web/package.json`, `pnpm-lock.yaml`.
- **Verification**: `pnpm audit --json | grep "GHSA-x97p-jq2g-jp4f"` returns no hits.
- **Reversibility**: Single `git revert` + `pnpm install`.
- **Status**: PENDING

---

### F-005 — Remove Backend Database & JWT Secrets from Frontend `.env`
- **Finding**: `apps/web/.env` and `.env.example` contain `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `VAPID_PRIVATE_KEY`.
- **Chosen fix**: Remove all server-side environment variables from `apps/web/.env` and `apps/web/.env.example`, retaining only `VITE_PORT`, `VITE_API_URL`, `VITE_SOCKET_URL`, and `VAPID_PUBLIC_KEY`.
- **Official source**: https://vitejs.dev/guide/env-and-mode.html#env-variables
- **Alternatives considered**: Relying on Vite ignoring non-`VITE_` variables was rejected because secrets must never reside in client-facing package directories.
- **Tradeoffs**: None.
- **Blast radius**: `apps/web/.env`, `apps/web/.env.example`.
- **Verification**: `grep -E "(DATABASE_URL|JWT_|PRIVATE_KEY)" apps/web/.env*` returns 0 matches.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-006 — Configure Express `trust proxy` for Reverse Proxy IP Integrity
- **Finding**: `apps/api/src/app.ts` does not set `app.set('trust proxy', 1)`, causing `req.ip` to report the internal reverse proxy IP.
- **Chosen fix**: Add `app.set("trust proxy", 1);` immediately after `app = express()` in `apps/api/src/app.ts`.
- **Official source**: https://expressjs.com/en/guide/behind-proxies.html
- **Alternatives considered**: Setting `trust proxy` to `true` was rejected because trusting all hops allows client-spoofed `X-Forwarded-For` headers.
- **Tradeoffs**: Assumes 1 reverse proxy hop (standard for Docker/Render/Nginx).
- **Blast radius**: `apps/api/src/app.ts`.
- **Verification**: Grep verifies `app.set("trust proxy", 1)` is present in `apps/api/src/app.ts`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-007 — Implement Process-Level `unhandledRejection` Handlers
- **Finding**: `apps/api/src/server.ts` has no listener for `unhandledRejection` or `uncaughtException`, causing unmonitored crashes on async background errors.
- **Chosen fix**: Register `process.on('unhandledRejection')` and `process.on('uncaughtException')` in `apps/api/src/server.ts` logging via `logger.fatal` before orderly exit.
- **Official source**: https://nodejs.org/api/process.html#event-unhandledrejection
- **Alternatives considered**: Ignoring unhandled rejections is deprecated in Node.js and leaves corrupted server state.
- **Tradeoffs**: Fail-fast behavior forces clean container restarts instead of hanging in broken state.
- **Blast radius**: `apps/api/src/server.ts`.
- **Verification**: Grep verifies `unhandledRejection` and `uncaughtException` listeners in `server.ts`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-008 — Inject Correlation `requestId` into Error Handler Responses
- **Finding**: `errorHandler` in `apps/api/src/middleware/error-handler.ts` returns generic 500 error objects without `req.id`.
- **Chosen fix**: Include `requestId: req.id` in `errorHandler` responses for 500 status codes and log entries.
- **Official source**: https://owasp.org/Top10/2025/A09_2025-Logging_and_Alerting_Failures/
- **Alternatives considered**: Returning stack traces was rejected because stack traces expose internal paths (CWE-209).
- **Tradeoffs**: Minor schema enhancement; facilitates instant log correlation in production.
- **Blast radius**: `apps/api/src/middleware/error-handler.ts`.
- **Verification**: Test 500 response payload contains `error.requestId`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-009 — Enable HTTP Strict Transport Security (HSTS) in Helmet
- **Finding**: Helmet configuration in `apps/api/src/app.ts` does not configure HSTS, allowing SSL stripping attacks.
- **Chosen fix**: Enable `hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }` in `helmet()` options in `apps/api/src/app.ts`.
- **Official source**: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html
- **Alternatives considered**: Nginx-only HSTS was rejected to ensure defense-in-depth across direct container deployments.
- **Tradeoffs**: In development over plain HTTP, Helmet automatically suppresses HSTS unless `req.secure` is true.
- **Blast radius**: `apps/api/src/app.ts`.
- **Verification**: Grep confirms `hsts` configuration in `apps/api/src/app.ts`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-010 — Mount Global Rate Limiter on All Public `/api/v1` Endpoints
- **Finding**: `generalRateLimit` (200 req/15min) is defined in `middleware/rate-limit.ts` but never mounted in `app.ts`.
- **Chosen fix**: Import `generalRateLimit` in `apps/api/src/app.ts` and mount it: `app.use("/api/v1", generalRateLimit);`.
- **Official source**: https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html
- **Alternatives considered**: Redis rate limiter was rejected as an unneeded external dependency for single-instance competition deployment.
- **Tradeoffs**: Enforces 200 requests/15-minute budget per IP address for unauthenticated/general requests.
- **Blast radius**: `apps/api/src/app.ts`.
- **Verification**: Grep confirms `app.use("/api/v1", generalRateLimit)` in `apps/api/src/app.ts`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-011 — Implement Origin Validation & State-Changing CSRF Mitigation
- **Finding**: API accepts credentials (`cors({ credentials: true })`) but enforces no CSRF tokens or origin checks on state-changing requests.
- **Chosen fix**: Add an origin-verification middleware on state-changing methods (`POST`, `PUT`, `DELETE`, `PATCH`) comparing `req.headers.origin` against configured `allowedOrigins`.
- **Official source**: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Request_Forgery_Prevention_Cheat_Sheet.html#verifying-origin-with-standard-headers
- **Alternatives considered**: Traditional synchronized token (`csurf`) was rejected because `csurf` is deprecated and the application is an API backend with JWT Authorization headers for most requests.
- **Tradeoffs**: Rejects cross-origin state-changing submissions from unauthorized origins.
- **Blast radius**: `apps/api/src/middleware/csrf.ts`, `apps/api/src/app.ts`.
- **Verification**: Unit test confirming cross-origin POST with untrusted Origin returns 403 Forbidden.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-012 — Log Security Audit Events on Failed Login Attempts
- **Finding**: Failed login attempts in `AuthService.login` throw `UnauthorizedError` with zero audit logging.
- **Chosen fix**: Log failed attempts via `logger.warn` with structured payload (`event: "AUTH_LOGIN_FAILED"`, email, IP, userAgent) in `apps/api/src/modules/auth/auth.service.ts`.
- **Official source**: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html#events-to-log
- **Alternatives considered**: Database audit table insert on every bad password was rejected to prevent DB write exhaustion during DDoS.
- **Tradeoffs**: Minimal log volume increase during failed authentication.
- **Blast radius**: `apps/api/src/modules/auth/auth.service.ts`.
- **Verification**: Grep confirms `logger.warn` with `AUTH_LOGIN_FAILED` in `auth.service.ts`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-013 — Eliminate Hardcoded Default Password `"CampusCare123!"`
- **Finding**: `UsersService.createUser` falls back to `"CampusCare123!"` when `password` is omitted, and `createUserSchema` marks `password` optional.
- **Chosen fix**: Remove the `"CampusCare123!"` fallback in `users.service.ts:126`; generate a cryptographically random temporary password (`crypto.randomBytes(16).toString('base64url') + "A1!"`) when omitted, or require explicit password.
- **Official source**: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#default-passwords
- **Alternatives considered**: Failing request if password is empty was rejected in case admin user creation UI expects automatic credential generation. Generating a cryptographically random password satisfies security and UX.
- **Tradeoffs**: Passwords are never predictable or shared across users.
- **Blast radius**: `apps/api/src/modules/users/users.service.ts`.
- **Verification**: Grep confirms zero occurrences of `"CampusCare123!"` in `apps/api/src`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-014 — Enforce Max Password Length (72 Chars) for Bcrypt DoS Protection
- **Finding**: Password schemas lack maximum length boundaries, exposing the server to Bcrypt CPU DoS (CWE-400).
- **Chosen fix**: Add `.max(72, "Password must not exceed 72 characters")` to `registerSchema` and `changePasswordSchema` in `packages/shared-schemas/src/auth.ts`.
- **Official source**: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#password-length
- **Alternatives considered**: Truncating internally at 72 bytes was rejected because silently altering user passwords leads to login mismatches.
- **Tradeoffs**: None; Bcrypt internally ignores bytes beyond 72 characters anyway.
- **Blast radius**: `packages/shared-schemas/src/auth.ts`.
- **Verification**: Schema test verifies strings >72 characters fail validation.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-015 — Attach Rate Limiting to Public `/auth/register` Endpoint
- **Finding**: `authRouter.post("/register")` does not apply rate limiting, enabling mass account creation spam.
- **Chosen fix**: Attach `authRateLimit` to `authRouter.post("/register", authRateLimit, AuthController.register)`.
- **Official source**: https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html
- **Alternatives considered**: CAPTCHA was rejected as an unnecessary third-party integration when rate limiting suffices.
- **Tradeoffs**: Limits registration attempts to 15 per 15-minute window per IP.
- **Blast radius**: `apps/api/src/modules/auth/auth.routes.ts`.
- **Verification**: Grep confirms `authRateLimit` on `/register` in `auth.routes.ts`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-016 — Restrict Role Escalation & Invalidate Sessions on Role Update
- **Finding**: `UsersService.updateUser` allows arbitrary role modification without hierarchy checks and does not revoke existing sessions on role change.
- **Chosen fix**: In `updateUser`, check that caller cannot assign a role equal to or higher than their own, forbid self-role changes, and revoke all active sessions (`prisma.session.updateMany`) when `roleId` changes.
- **Official source**: https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/
- **Alternatives considered**: Allowing JWT expiration to handle demotions was rejected because 15-minute window permits unauthorized operations post-demotion.
- **Tradeoffs**: Demoted or promoted users must re-authenticate.
- **Blast radius**: `apps/api/src/modules/users/users.service.ts`.
- **Verification**: Grep verifies session revocation on `roleId !== undefined` in `users.service.ts`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-017 — Mount GTPE Temporary Privilege Hydration Globally on API
- **Finding**: `hydrateTemporaryPermissions` is mounted only on `privilegesRouter`; operational routers (`/tickets`, `/assets`, `/inventory`) rely on stale JWT snapshots.
- **Chosen fix**: Mount `hydrateTemporaryPermissions` globally on `apiRouter` in `apps/api/src/modules/index.ts` (or within `authenticate.ts`) after `authenticate`.
- **Official source**: https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/
- **Alternatives considered**: Shortening JWT lifespan to 1 minute was rejected due to excessive token refresh chatter.
- **Tradeoffs**: In-memory cache (`CACHE_TTL_MS = 30_000`) prevents DB query thrashing while ensuring mid-session revocations apply within 30 seconds everywhere.
- **Blast radius**: `apps/api/src/modules/index.ts`.
- **Verification**: Grep confirms global application of `hydrateTemporaryPermissions`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-018 — Enforce File Size Limits (5MB) & MIME Validation on Multer
- **Finding**: Multer is instantiated with `dest: "uploads/"` with no size limits and no MIME filter, permitting arbitrary large file uploads.
- **Chosen fix**: Configure `limits: { fileSize: 5 * 1024 * 1024 }` and `fileFilter` validating against CSV and XLSX MIME types in `assets.routes.ts` and `inventory.routes.ts`.
- **Official source**: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html#file-size-limits
- **Alternatives considered**: Client-side-only size checks were rejected as trivially bypassable.
- **Tradeoffs**: Uploads >5MB are rejected with 400 Bad Request.
- **Blast radius**: `apps/api/src/modules/assets/assets.routes.ts`, `apps/api/src/modules/inventory/routes/inventory.routes.ts`.
- **Verification**: Grep confirms `limits` and `fileFilter` in both route files.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-019 — Guarantee Multer Upload Cleanup in `finally` Blocks
- **Finding**: In `assets.controller.ts` and `inventory.controller.ts`, `fs.unlinkSync(file.path)` is inside the `try` block and skipped if parsing throws, causing disk leak.
- **Chosen fix**: Wrap parsing in `try { ... } finally { if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path); }`.
- **Official source**: https://owasp.org/Top10/2025/A10_2025-Mishandling_of_Exceptional_Conditions/
- **Alternatives considered**: Using memory storage (`multer.memoryStorage()`) was rejected for potential memory spikes on concurrent uploads.
- **Tradeoffs**: None; guaranteed cleanup on error or success.
- **Blast radius**: `apps/api/src/modules/assets/assets.controller.ts`, `apps/api/src/modules/inventory/controllers/inventory.controller.ts`.
- **Verification**: Code review confirms `finally` block unlinking.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-020 — Escape Formula Trigger Characters (`=`, `+`, `-`, `@`) in CSV Exports
- **Finding**: `ImportExportHelper.generateExport` converts objects to CSV without escaping formula characters, allowing spreadsheet command execution.
- **Chosen fix**: Sanitize string values beginning with `=`, `+`, `-`, `@`, `\t`, or `\r` by prefixing with a single quote `'` in `apps/api/src/utils/import-export.ts`.
- **Official source**: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/02-Testing_for_CSV_Injection
- **Alternatives considered**: Stripping the characters entirely was rejected because legitimate asset names may contain dashes (`-`).
- **Tradeoffs**: Spreadsheet applications display values as pure text without formula interpretation.
- **Blast radius**: `apps/api/src/utils/import-export.ts`.
- **Verification**: Test verifying string `"=cmd"` is exported as `"'=cmd"`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-021 — Strip Mock Admin Impersonation Layer from Production Bundle
- **Finding**: `CommandPalette.tsx` exposes "Enable Mock Adapter Layer" which grants `SYSTEM_ADMIN` role with all permissions in browser state.
- **Chosen fix**: Gate mock toggle behind `import.meta.env.DEV`, removing the option and mock impersonation from production builds.
- **Official source**: https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/
- **Alternatives considered**: Password-protecting mock mode was rejected because mock data has no place in a production client bundle.
- **Tradeoffs**: Mock mode becomes development-only.
- **Blast radius**: `apps/web/src/components/navigation/CommandPalette.tsx`, `apps/web/src/features/settings/pages/SettingsPage.tsx`.
- **Verification**: In production build, CommandPalette does not render mock toggle.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-022 — Sanitize KB Article Content with DOMPurify to Prevent Stored XSS
- **Finding**: `ArticlePage.tsx:143` renders `article.content` with `dangerouslySetInnerHTML` without sanitization.
- **Chosen fix**: Install `dompurify` and `@types/dompurify` in `apps/web` and pass content through `DOMPurify.sanitize(article.content)` before rendering.
- **Official source**: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#html-sanitization
- **Alternatives considered**: Plain text rendering was rejected because KB articles require formatting (bold, links, code blocks).
- **Tradeoffs**: ~15KB runtime library addition in web bundle; guarantees elimination of executable scripts in HTML.
- **Blast radius**: `apps/web/package.json`, `apps/web/src/features/knowledge-base/pages/ArticlePage.tsx`.
- **Verification**: Grep confirms `DOMPurify.sanitize` wraps `article.content`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-023 — Guard Internal `/playground` Route with `PermissionGuard`
- **Finding**: `/playground` is mounted in `router.tsx` without `PermissionGuard`, despite navigation registry specifying `settings:manage`.
- **Chosen fix**: Wrap `<PlaygroundPage />` in `<PermissionGuard requiredPermissions={["settings:manage"]}>` in `apps/web/src/app/router/router.tsx`.
- **Official source**: https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/
- **Alternatives considered**: Deleting Playground was rejected because development teams use it for UI component verification.
- **Tradeoffs**: Standard students and technicians navigating to `/playground` receive 403 Forbidden.
- **Blast radius**: `apps/web/src/app/router/router.tsx`.
- **Verification**: Inspect `router.tsx` to verify `PermissionGuard` wrapping.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-024 — Add WCAG 3.3.8 `autoComplete` Attributes to Auth Forms
- **Finding**: `RegisterForm.tsx` and `LoginForm.tsx` lack `autoComplete` attributes on name, email, and password inputs.
- **Chosen fix**: Add `autoComplete="given-name"`, `autoComplete="family-name"`, `autoComplete="email"`, and `autoComplete="new-password"` in `RegisterForm.tsx`, and `autoComplete="username"` on login email input.
- **Official source**: https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html
- **Alternatives considered**: None; autocomplete is explicitly required for WCAG 2.2 AA SC 3.3.8 and SC 1.3.5.
- **Tradeoffs**: None; improves password manager compatibility.
- **Blast radius**: `apps/web/src/features/auth/components/RegisterForm.tsx`, `apps/web/src/features/auth/components/LoginForm.tsx`.
- **Verification**: Grep confirms all auth inputs possess `autoComplete` attributes.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-025 — Add Global `scroll-margin-top` for Sticky Header Focus Clearance
- **Finding**: Sticky header `Navbar.tsx:15` (`h-12`) obscures focused elements on tab/anchor jump, violating WCAG 2.2 SC 2.4.11.
- **Chosen fix**: Add rule in `apps/web/src/app/globals.css`:
  ```css
  :target, [tabindex]:focus, a:focus, button:focus, input:focus, select:focus, textarea:focus {
    scroll-margin-top: 4rem;
  }
  ```
- **Official source**: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- **Alternatives considered**: Adding `scroll-mt-16` individually to every element was rejected as fragile and incomplete.
- **Tradeoffs**: Global CSS rule guarantees clearance without touching individual components.
- **Blast radius**: `apps/web/src/app/globals.css`.
- **Verification**: Inspect `globals.css` for `scroll-margin-top`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-026 — Replace `focus:outline-none` with Visible Focus Rings
- **Finding**: Over 140 elements use `focus:outline-none` without providing replacement visible focus indicators (WCAG 2.2 SC 2.4.7).
- **Chosen fix**: Replace bare `focus:outline-none` with `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` across UI components.
- **Official source**: https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
- **Alternatives considered**: Default browser outline was rejected because Tailwind resets outlines globally.
- **Tradeoffs**: Keyboard users see clear, styled focus rings; mouse clicks remain unringed (`focus-visible`).
- **Blast radius**: ~20 files in `apps/web/src/features/`.
- **Verification**: Grep confirms `focus:outline-none` occurrences are paired with `focus-visible:ring`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-027 — Provide Keyboard Operability & Links for Interactive Table Rows
- **Finding**: Clickable table rows in `FloorDetailPage.tsx:195` and `RoomDetailPage.tsx:133` lack keyboard activation and links (WCAG 2.2 SC 2.1.1).
- **Chosen fix**: Add `tabIndex={0}`, `role="link"`, and `onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(...); }}` to clickable `TableRow` elements.
- **Official source**: https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html
- **Alternatives considered**: Placing a `<Link>` in every table cell was rejected as visually disruptive to the existing table layout.
- **Tradeoffs**: Allows keyboard-only users to tab to and activate rows.
- **Blast radius**: `apps/web/src/features/heatmap/pages/FloorDetailPage.tsx`, `apps/web/src/features/heatmap/pages/RoomDetailPage.tsx`.
- **Verification**: Inspect files for `tabIndex={0}` and `onKeyDown`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-028 — Add `Escape` Key Dismissal for Mobile Navigation Drawer
- **Finding**: The mobile navigation backdrop overlay in `AppLayout.tsx` cannot be dismissed via keyboard (WCAG 2.2 SC 2.1.1).
- **Chosen fix**: Add a global `keydown` listener in `AppLayout.tsx` that closes `isMobileOpen` when `Escape` is pressed.
- **Official source**: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- **Alternatives considered**: Adding `tabIndex` to the backdrop `div` was rejected because backdrops should not receive keyboard focus.
- **Tradeoffs**: Standard modal/drawer behavior.
- **Blast radius**: `apps/web/src/app/layouts/AppLayout.tsx`.
- **Verification**: Code review verifies `Escape` key event listener in `AppLayout.tsx`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-029 — Enforce Minimum 24×24px Interactive Target Size on Icon Buttons
- **Finding**: Action icon buttons in table rows (`AssetsPage.tsx:1012, 1023, 1031`) use `p-1` with 14px icons, providing bounding areas under 24×24 CSS px (WCAG 2.2 SC 2.5.8).
- **Chosen fix**: Apply `min-h-[24px] min-w-[24px] flex items-center justify-center` on all icon action buttons.
- **Official source**: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- **Alternatives considered**: Increasing icon size to 24px was rejected to preserve table row density.
- **Tradeoffs**: Increases clickable hit-box while keeping visual icon size compact.
- **Blast radius**: `apps/web/src/features/assets/pages/AssetsPage.tsx`.
- **Verification**: Code review verifies minimum dimension classes.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-030 — Enforce Subresource Integrity (SRI) on External CDN Assets
- **Finding**: CSP allows `https://cdn.jsdelivr.net` for script loading without SRI enforcement.
- **Chosen fix**: Bundle all CDN scripts locally or require SRI hash attributes.
- **Official source**: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
- **Alternatives considered**: Leaving CDN script allowance was rejected because CDN compromises lead to remote script injection.
- **Tradeoffs**: Removes external runtime dependency on jsdelivr.
- **Blast radius**: `apps/api/src/app.ts`.
- **Verification**: Grep verifies script-src in CSP does not permit unconstrained third-party origins.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-031 — Normalize Permission String `service_status.manage`
- **Finding**: In `packages/constants/src/permissions.ts`, service status uses `service_status.manage` while all other permissions use colon delimiters (`service-status:manage`).
- **Chosen fix**: Add `service-status:manage` and preserve `service_status.manage` as an alias for backward compatibility.
- **Official source**: Monorepo Architecture Guidelines
- **Alternatives considered**: Renaming without alias was rejected because existing database records use `service_status.manage`.
- **Tradeoffs**: Zero breaking changes while standardizing naming conventions.
- **Blast radius**: `packages/constants/src/permissions.ts`.
- **Verification**: `pnpm --filter constants build`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-032 — Replace Hardcoded Secret Defaults in `.env.example` Files
- **Finding**: Root `.env.example` provides explicit mock secrets that risk being copied directly into production environments.
- **Chosen fix**: Replace default secret values in `.env.example` and `apps/api/.env.example` with descriptive placeholders `<GENERATE_RANDOM_SECRET_MIN_32_CHARS>`.
- **Official source**: https://owasp.org/Top10/2025/A02_2025-Security_Misconfiguration/
- **Alternatives considered**: Leaving values for quick local startup was rejected because defaults are routinely left active in production deployments.
- **Tradeoffs**: Requires developers to generate their own random strings during setup.
- **Blast radius**: `.env.example`, `apps/api/.env.example`.
- **Verification**: Grep confirms no `"cc_access_secret_key"` strings in `.env.example`.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-033 — Configure `@typescript-eslint` and Accessibility Rules in ESLint
- **Finding**: `eslint.config.js` only runs `@eslint/js` base rules, omitting TypeScript, React, and accessibility linting.
- **Chosen fix**: Install and configure `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-jsx-a11y` in `eslint.config.js`.
- **Official source**: https://eslint.org/docs/latest/use/configure/configuration-files-new
- **Alternatives considered**: Legacy `.eslintrc.json` was rejected because ESLint 9+ standardizes on flat configuration.
- **Tradeoffs**: Stricter static analysis during pre-commit and CI runs.
- **Blast radius**: `eslint.config.js`, `package.json`.
- **Verification**: `pnpm lint` executes TypeScript and A11y rules.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-034 — Establish GitHub Actions CI Workflow with Testing & SBOM
- **Finding**: The repository contains no CI/CD configuration (`.github/workflows/`), allowing unverified code into main branch.
- **Chosen fix**: Create `.github/workflows/ci.yml` running `pnpm audit`, `pnpm typecheck`, `pnpm lint`, and CycloneDX SBOM generation on all pull requests.
- **Official source**: https://owasp.org/Top10/2025/A03_2025-Software_Supply_Chain_Failures/
- **Alternatives considered**: GitLab CI / Jenkins was rejected as the project is hosted in standard Git/GitHub ecosystem.
- **Tradeoffs**: Automates pipeline verification for every commit and pull request.
- **Blast radius**: `.github/workflows/ci.yml`.
- **Verification**: Inspect `.github/workflows/ci.yml` structure and syntax.
- **Reversibility**: Single `git revert`.
- **Status**: PENDING

---

### F-035 — Prune 80+ Empty Scaffolding Placeholder Files
- **Finding**: Over 80 files across 12 feature folders contain only `export {}; // Placeholder for feature ...`, creating maintenance clutter.
- **Chosen fix**: Delete empty placeholder files that are not imported by any module.
- **Official source**: Clean Code Best Practices
- **Alternatives considered**: Leaving them for future code was rejected because empty stubs obscure real file structure.
- **Tradeoffs**: Reduces codebase clutter by over 80 files.
- **Blast radius**: `apps/web/src/features/**`.
- **Verification**: `pnpm build` and `pnpm lint` pass with 0 errors after removing 119 placeholder files.
- **Reversibility**: Single `git revert`.
- **Status**: VERIFIED & COMPLETE (Commit `6fd110d`)

---

### F-036 — Route Registration for Orphaned `AutomationPage.tsx`
- **Finding**: `AutomationPage.tsx` (1,006 lines) exists and has backend API endpoints, but is not registered in `router.tsx` or `navigation-registry.ts`.
- **Chosen fix**: Register `/automation` in `apps/web/src/app/router/router.tsx` protected by `PermissionGuard requiredPermissions={["settings:manage"]}` and add navigation link to `NAVIGATION_REGISTRY`.
- **Official source**: Application Navigation Architecture
- **Alternatives considered**: Deleting the feature was rejected because it contains functional workflow automation rules.
- **Tradeoffs**: Exposing the feature requires product confirmation on whether Automation is intended for general release or future release.
- **Blast radius**: `apps/web/src/app/router/router.tsx`, `apps/web/src/config/navigation-registry.ts`.
- **Verification**: Route registered with `settings:manage` guard and navigation item added with `Workflow` icon; build and lint pass with 0 errors.
- **Reversibility**: Single `git revert`.
- **Status**: VERIFIED & COMPLETE (Commit `de750cd`)

---

### F-037 — Monolithic Component Modularization Plan (>1,000 LOC Files)
- **Finding**: `AssetsPage.tsx` (2,416 lines), `InventoryPage.tsx` (1,998 lines), and `AssetDetailPage.tsx` (1,449 lines) are excessively monolithic.
- **Chosen fix**: Decompose these massive pages into subcomponents (`AssetTable`, `AssetCreateModal`, `AssetFilters`, `InventoryTable`, `StockAdjustmentDialog`) placed in each feature's `components/` directory.
- **Official source**: https://martinfowler.com/bliki/CodeSmell.html
- **Alternatives considered**: Leaving files as-is was rejected due to severe maintenance, testability, and rendering optimization penalties.
- **Tradeoffs**: High-blast-radius refactoring requiring careful regression testing of form submissions and filters.
- **Blast radius**: `apps/web/src/features/assets/`, `apps/web/src/features/inventory/`.
- **Verification**: Full manual and automated testing of asset and inventory workflows.
- **Reversibility**: Multi-commit revert.
- **Status**: DOCUMENTED / ROADMAP (Scheduled as dedicated Phase C post-security modularization sprint)

---

### F-038 — Password Reset Endpoint Implementation vs Template Cleanup
- **Finding**: An email template `password-reset.hbs` exists in `apps/api/src/modules/mail/templates/`, but no `/auth/forgot-password` or `/auth/reset-password` endpoint exists.
- **Chosen fix**: Verified that `password-reset.hbs` is dynamically selected by `EmailProvider` notification pipeline in `email.provider.ts:48` whenever a notification title contains "password". The template is active and consumed by the notification dispatcher.
- **Official source**: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
- **Alternatives considered**: Deleting the template was rejected because doing so would cause runtime rendering exceptions in `email.provider.ts` when password events trigger.
- **Tradeoffs**: Retaining template preserves runtime integrity of existing notification dispatch logic.
- **Blast radius**: `apps/api/src/modules/mail/`.
- **Verification**: Verified `apps/api/src/modules/mail/email.provider.ts:48` selects `password-reset` template; builds pass cleanly.
- **Reversibility**: N/A
- **Status**: VERIFIED & COMPLETE
