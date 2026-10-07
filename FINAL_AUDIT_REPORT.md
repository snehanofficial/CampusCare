# Production Readiness Audit Report
**Repository**: CampusCare
**Audit Date**: 2026-10-07
**Auditor**: Antigravity Principal Engineering & Security Audit Engine (v2.0)
**Standards Applied**: OWASP Top 10 2025, OWASP ASVS 5.0.0, WCAG 2.2 AA, W3C Web Content Accessibility Guidelines

## Executive Summary
- Total findings: **7 Critical**, **14 High**, **11 Medium**, **6 Low** (Total: 38 Findings)
- **Top 3 blocking issues for production**:
  1. **Backend Build Failure**: `tsc` compilation fails with 165 errors across 43 files due to Prisma 7 module export incompatibility (`Module '"@prisma/client"' has no exported member 'Prisma'`), completely blocking production compilation (`pnpm -r build`).
  2. **Stored Cross-Site Scripting (XSS)**: Unsanitized database article content rendered directly via `dangerouslySetInnerHTML` in `ArticlePage.tsx:143` without DOMPurify sanitization.
  3. **Hardcoded Default Password Backdoor**: Omission of user password during admin creation in `users.service.ts:126` silently sets the password to static string `"CampusCare123!"` coupled with `createUserSchema` marking `password` as optional.
- **Overall risk assessment**: **CRITICAL (NON-DEPLOYABLE)**. The repository cannot currently build for production, contains active stored XSS and authentication backdoor vulnerabilities, 53 supply-chain CVEs (including critical IP-spoofing in `proxy-addr`), global rate-limiting bypass, unconstrained file uploads, and extensive WCAG 2.2 focus/keyboard accessibility violations.

---

## Findings

### CRIT-01 — TypeScript Compilation Failure Blocking Production Build
- **File**: `apps/api/src/database/prisma.ts:1`
- **Severity**: Critical
- **Confidence**: High (Observed via `pnpm --filter api build` and `pnpm typecheck`)
- **Category**: Architecture & Build Integrity
- **Description**: Running the root production build or `pnpm typecheck` fails with 165 TypeScript errors across 43 files in `apps/api`. Under Prisma 7, `@prisma/client` does not export `Prisma` namespace in this configuration, preventing container image creation and production deployment.
- **Evidence**:
  ```
  src/database/prisma.ts:1 - error TS2305: Module '"@prisma/client"' has no exported member 'Prisma'.
  src/middleware/error-handler.ts:5 - error TS2305: Module '"@prisma/client"' has no exported member 'Prisma'.
  src/modules/tickets/tickets.repository.ts:2 - error TS2305: Module '"@prisma/client"' has no exported member 'Prisma'.
  Found 165 errors in 43 files.
  [ELIFECYCLE] Command failed with exit code 2.
  ```
- **Recommended Fix**: Update imports in `prisma.ts`, `error-handler.ts`, and repository files to import Prisma namespace correctly per Prisma 7 specifications (or import from `@prisma/client/runtime/library`), and update `tsconfig.json` module resolution settings.
- **Official Reference**: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions

---

### CRIT-02 — Stored Cross-Site Scripting (XSS) via Unsanitized Knowledge Base Content
- **File**: `apps/web/src/features/knowledge-base/pages/ArticlePage.tsx:143`
- **Severity**: Critical
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A05:2025 Injection / ASVS 5.0.0 §5.3.3
- **Description**: The knowledge base article viewer directly renders `article.content` using React's `dangerouslySetInnerHTML` without any HTML sanitization. Any user or technician with `knowledge-base:manage` permission (or via compromised database entry) can store malicious JavaScript payloads (e.g., `<script>`, `<img onerror=...>`, or iframe clickjackers) that execute within the browser context of any user viewing the article, compromising session tokens and user state.
- **Evidence**:
  ```tsx
  143: dangerouslySetInnerHTML={{ __html: article.content }}
  ```
- **Recommended Fix**: Install and sanitize the HTML payload with `dompurify` and `@types/dompurify` before injection:
  ```tsx
  import DOMPurify from "dompurify";
  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }} />
  ```
- **Official Reference**: https://owasp.org/Top10/2025/A05_2025-Injection/

---

### CRIT-03 — Hardcoded Default Account Creation Password
- **File**: `apps/api/src/modules/users/users.service.ts:126`
- **Severity**: Critical
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A07:2025 Authentication Failures / ASVS 5.0.0 §4.1.2
- **Description**: When creating a user through `UsersService.createUser`, if the caller does not supply a password, the system silently sets the user's password to static fallback `"CampusCare123!"`. In `apps/api/src/modules/users/users.schema.ts:10-15`, `password` is marked `.optional()`. An attacker who knows this default password can immediately compromise newly created accounts before the legitimate user logs in.
- **Evidence**:
  ```typescript
  126: const password = input.password || "CampusCare123!";
  127: const passwordHash = await bcrypt.hash(password, 12);
  ```
- **Recommended Fix**: Require `password` in `createUserSchema` or generate a cryptographically random single-use activation token (`crypto.randomBytes(32).toString('hex')`) and dispatch an invitation link via email rather than storing a deterministic shared default password.
- **Official Reference**: https://owasp.org/Top10/2025/A07_2025-Authentication_Failures/

---

### CRIT-04 — Critical Supply-Chain IP Spoofing in `proxy-addr`
- **File**: `pnpm-lock.yaml` (`apps/api` dependency: `express-rate-limit` → `express` → `proxy-addr@2.0.7`)
- **Severity**: Critical
- **Confidence**: High (Observed via `pnpm audit --json`)
- **Category**: OWASP A03:2025 Software Supply Chain Failures / OWASP A01:2025 Broken Access Control
- **Description**: `proxy-addr` versions `< 2.0.8` contain a critical vulnerability (CVE-2023-26160 / GHSA-jqcg-44mw-7w3h) where an attacker can forge client IP addresses via IPv4-mapped IPv6 subnet parsing. Because `req.ip` is relied upon for rate limiting and audit logs, attackers can bypass IP rate limits and spoof client audit entries.
- **Evidence**:
  ```json
  "id": 1241210,
  "title": "proxy-addr vulnerable to IP spoofing via IPv4-mapped IPv6 trust subnet",
  "module_name": "proxy-addr",
  "vulnerable_versions": ">=1.1.0 <2.0.8",
  "patched_versions": ">=2.0.8",
  "severity": "critical",
  "url": "https://github.com/advisories/GHSA-jqcg-44mw-7w3h"
  ```
- **Recommended Fix**: Add `pnpm.overrides` in root `package.json` to force `proxy-addr: "^2.0.8"` across all workspace packages and run `pnpm install`.
- **Official Reference**: https://github.com/advisories/GHSA-jqcg-44mw-7w3h

---

### CRIT-05 — Multiple High-Severity Remote Vulnerabilities in `axios`
- **File**: `apps/web/package.json:27`
- **Severity**: Critical
- **Confidence**: High (Observed via `pnpm audit --json`)
- **Category**: OWASP A03:2025 Software Supply Chain Failures / OWASP A05:2025 Injection
- **Description**: The web application pins `axios@^1.19.0`, which contains 8 published security advisories including prototype pollution gadgets (GHSA-x97p-jq2g-jp4f), SSRF via redirect handling (GHSA-r4gj-5m52-g5wh), and HTTP header injection (GHSA-j8rh-479h-cp32).
- **Evidence**:
  ```json
  "module_name": "axios",
  "vulnerable_versions": ">=1.15.1 <1.20.0",
  "patched_versions": ">=1.20.0",
  "severity": "high",
  "github_advisory_id": "GHSA-x97p-jq2g-jp4f"
  ```
- **Recommended Fix**: Upgrade `axios` in `apps/web/package.json` to `>=1.20.0` or replace with native `fetch` / standard wrapper.
- **Official Reference**: https://github.com/advisories/GHSA-x97p-jq2g-jp4f

---

### CRIT-06 — Production Leak of Full Mock Admin Environment
- **File**: `apps/web/src/mocks/index.ts:91-104` & `apps/web/src/components/navigation/CommandPalette.tsx:93-104`
- **Severity**: Critical
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A01:2025 Broken Access Control / Scope & Architecture
- **Description**: The mock adapter layer is bundled into the production bundle. Any user can trigger `Ctrl+K` and select "Enable Mock Adapter Layer" (or set localStorage key `campuscare-use-mocks: true`). When enabled, `mockAdapters.auth.getMe` assigns the user `SYSTEM_ADMIN` role and stamps EVERY permission from `PERMISSION_REGISTRY` into client state, allowing arbitrary client-side interface manipulation and simulated privileged actions.
- **Evidence**:
  ```typescript
  99: // Mocked user is a SYSTEM_ADMIN stand-in — grant every registered permission
  100: permissions: PERMISSION_REGISTRY.map((p) => p.code),
  ```
- **Recommended Fix**: Strip mock adapters and toggles completely from production builds using conditional Vite build-time tree shaking (`if (import.meta.env.DEV)`), and remove the mock toggle option from `CommandPalette.tsx` and `SettingsPage.tsx`.
- **Official Reference**: https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/

---

### CRIT-07 — Backend Database Credentials and Private Keys in Web `.env`
- **File**: `apps/web/.env:8-18`
- **Severity**: Critical
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A02:2025 Security Misconfiguration / OWASP A04:2025 Cryptographic Failures
- **Description**: The frontend client folder contains a `.env` file that specifies backend infrastructure secrets, including `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `VAPID_PRIVATE_KEY`. Storing backend database connection strings and JWT signing keys inside the frontend directory risks bundling secrets into client assets if imported or exposed.
- **Evidence**:
  ```env
  8: DATABASE_URL="postgresql://postgres:password@localhost:5432/campuscare?schema=public"
  9: JWT_ACCESS_SECRET="cc_access_secret_key_change_me_in_production_12345678"
  10: JWT_REFRESH_SECRET="cc_refresh_secret_key_change_me_in_production_87654321"
  18: VAPID_PRIVATE_KEY="z38jvccvUz7r_Yb5C4XoFkKo8C-UjR0h5CTnUzGwkG8"
  ```
- **Recommended Fix**: Remove all backend secrets from `apps/web/.env` and `apps/web/.env.example`. Only variables with `VITE_` prefix required by the browser bundle should exist in `apps/web/.env`.
- **Official Reference**: https://owasp.org/Top10/2025/A02_2025-Security_Misconfiguration/

---

### HIGH-01 — Global Rate Limiter Unmounted Across API
- **File**: `apps/api/src/app.ts:15-95` & `apps/api/src/middleware/rate-limit.ts:3`
- **Severity**: High
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A06:2025 Insecure Design / ASVS 5.0.0 §2.4.1
- **Description**: `generalRateLimit` is defined in `middleware/rate-limit.ts` (200 req/15min) but is never mounted in `app.ts` or on `apiRouter`. The entire public API operates without rate limiting, allowing denial of service and API scraping.
- **Evidence**: Grep confirms `generalRateLimit` is imported nowhere in `src/app.ts` or `src/modules/index.ts`.
- **Recommended Fix**: Mount `generalRateLimit` globally in `apps/api/src/app.ts`:
  ```typescript
  import { generalRateLimit } from "./middleware/rate-limit.js";
  app.use("/api/v1", generalRateLimit);
  ```
- **Official Reference**: https://owasp.org/Top10/2025/A06_2025-Insecure_Design/

---

### HIGH-02 — Missing Rate Limiting on User Registration Endpoint
- **File**: `apps/api/src/modules/auth/auth.routes.ts:15`
- **Severity**: High
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A06:2025 Insecure Design / ASVS 5.0.0 §2.4.1
- **Description**: While `/login` and `/refresh` apply `authRateLimit`, the public `/register` route does not have rate limiting middleware attached. An attacker can mass-create accounts, spam database records, and exhaust server storage.
- **Evidence**:
  ```typescript
  15: authRouter.post("/register", AuthController.register);
  ```
- **Recommended Fix**: Attach `authRateLimit` (or a dedicated registration limiter) to `authRouter.post("/register", authRateLimit, AuthController.register);`.
- **Official Reference**: https://owasp.org/Top10/2025/A06_2025-Insecure_Design/

---

### HIGH-03 — Temporary Privilege Escalation (GTPE) Revocation Failure Across Operational Routes
- **File**: `apps/api/src/modules/privileges/privileges.routes.ts:13` & `apps/api/src/middleware/authenticate.ts:55`
- **Severity**: High
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A01:2025 Broken Access Control / ASVS 5.0.0 §4.2.1
- **Description**: `hydrateTemporaryPermissions` middleware is only mounted on `privilegesRouter`. Across all core operational routers (`/tickets`, `/assets`, `/users`, `/inventory`), user permissions are read statically from the minted JWT payload (`authenticate.ts:55`). If an administrator revokes a temporary access grant mid-session, the user retains unauthorized operational access until their 15-minute token expires.
- **Evidence**:
  ```typescript
  // privileges.routes.ts:13
  privilegesRouter.use(authenticate, hydrateTemporaryPermissions);
  // privileges.middleware.ts:14-16
  // "Elsewhere in the API, revocation takes effect on the next refresh..."
  ```
- **Recommended Fix**: Mount `hydrateTemporaryPermissions` globally within `authenticate.ts` or on `apiRouter` so all endpoints enforce live privilege revocations uniformly.
- **Official Reference**: https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/

---

### HIGH-04 — Role Escalation and Missing Session Revocation on User Modification
- **File**: `apps/api/src/modules/users/users.service.ts:185-210`
- **Severity**: High
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A01:2025 Broken Access Control / OWASP A07:2025 Authentication Failures
- **Description**: In `UsersService.updateUser`, a user with `users:manage` can change `roleId` on any user account without verifying privilege hierarchy (allowing self-escalation or promoting colleagues to SYSTEM_ADMIN). Furthermore, changing a user's role does NOT revoke active sessions or refresh tokens (revocation only triggers if `input.isActive === false`), allowing demoted users to retain old privileges.
- **Evidence**:
  ```typescript
  185: if (input.roleId !== undefined) {
  186:   updateData.role = { connect: { id: input.roleId } };
  187: }
  ...
  200: if (input.isActive === false) { // Sessions only revoked on isActive: false!
  ```
- **Recommended Fix**: Validate that the caller cannot grant roles higher than their own role, forbid modifying own role, and revoke all active user sessions (`prisma.session.updateMany`) upon any role change.
- **Official Reference**: https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/

---

### HIGH-05 — Missing State-Changing CSRF Protection
- **File**: `apps/api/src/app.ts:37-40` & `apps/api/src/modules/auth/auth.controller.ts:36`
- **Severity**: High
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A01:2025 Broken Access Control / ASVS 5.0.0 §3.2.1
- **Description**: The API enables `cors({ credentials: true })` and stores authentication refresh tokens in cookies. However, there is no CSRF token protection or custom request header requirement for state-changing routes (`POST`, `PUT`, `DELETE`, `PATCH`). While `SameSite=Strict` is set on the cookie, cross-origin requests from top-level navigations or subdomains on the same parent domain can forge actions.
- **Evidence**: Grep reveals zero CSRF validation or token generation across `apps/api`.
- **Recommended Fix**: Implement CSRF mitigation via double-submit cookie pattern or strict origin header verification (`Origin` / `Sec-Fetch-Site` validation) on state-changing API endpoints.
- **Official Reference**: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Request_Forgery_Prevention_Cheat_Sheet.html

---

### HIGH-06 — Missing HTTP Strict Transport Security (HSTS) Header
- **File**: `apps/api/src/app.ts:27-35`
- **Severity**: High
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A02:2025 Security Misconfiguration / ASVS 5.0.0 §2.2.5
- **Description**: Helmet is configured in `app.ts` with custom CSP directives, but HSTS (`Strict-Transport-Security`) is omitted. In production deployments, failure to send HSTS allows SSL stripping attacks where network intermediaries downgrade HTTPS connections to unencrypted HTTP.
- **Evidence**:
  ```typescript
  27: app.use(helmet({
  28:     contentSecurityPolicy: { ... }
  29:   }) as any);
  ```
- **Recommended Fix**: Explicitly configure HSTS in Helmet:
  ```typescript
  app.use(helmet({
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    contentSecurityPolicy: { ... }
  }));
  ```
- **Official Reference**: https://owasp.org/Top10/2025/A02_2025-Security_Misconfiguration/

---

### HIGH-07 — Unrestricted File Upload via Multer (No File Filter or Size Limits)
- **File**: `apps/api/src/modules/assets/assets.routes.ts:8` & `apps/api/src/modules/inventory/routes/inventory.routes.ts:9`
- **Severity**: High
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A06:2025 Insecure Design / ASVS 5.0.0 §12.1.1
- **Description**: Multer is instantiated as `multer({ dest: "uploads/" })` with no `limits.fileSize` and no `fileFilter`. An authenticated attacker can upload arbitrary multi-gigabyte files or malicious executables to fill the local storage, resulting in denial of service.
- **Evidence**:
  ```typescript
  8: const upload = multer({ dest: "uploads/" });
  ```
- **Recommended Fix**: Enforce strict MIME-type validation and max file size limits (e.g., 5MB):
  ```typescript
  const upload = multer({
    dest: "uploads/",
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ["text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
      cb(null, allowed.includes(file.mimetype));
    }
  });
  ```
- **Official Reference**: https://owasp.org/Top10/2025/A06_2025-Insecure_Design/

---

### HIGH-08 — Formula / CSV Injection in Data Exports
- **File**: `apps/api/src/utils/import-export.ts:110-120`
- **Severity**: High
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A05:2025 Injection / ASVS 5.0.0 §5.3.4
- **Description**: In `ImportExportHelper.generateExport`, data objects are converted directly to CSV/XLSX via `XLSX.utils.json_to_sheet(data)`. If a malicious user registers an asset or inventory item whose name or code begins with formula triggers (`=`, `+`, `-`, `@`), spreadsheet applications will execute the command upon opening the exported CSV.
- **Evidence**:
  ```typescript
  110: const worksheet = XLSX.utils.json_to_sheet(data);
  ```
- **Recommended Fix**: Sanitize cell strings before sheet generation by prefixing formula characters (`=`, `+`, `-`, `@`, `\t`, `\r`) with a single quote `'`.
- **Official Reference**: https://owasp.org/Top10/2025/A05_2025-Injection/

---

### HIGH-09 — Missing Audit Logging on Authentication Failures
- **File**: `apps/api/src/modules/auth/auth.service.ts:121-128`
- **Severity**: High
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A09:2025 Logging & Alerting Failures / ASVS 5.0.0 §8.1.1
- **Description**: When credentials fail in `AuthService.login`, an `UnauthorizedError` is thrown directly without logging the attempt, IP address, user-agent, or timestamp to the audit logging system. Security operations cannot detect brute-force attacks or credential-stuffing campaigns.
- **Evidence**:
  ```typescript
  121: if (!user || !user.isActive) {
  122:   throw new UnauthorizedError("Invalid email or password");
  123: }
  125: const isValid = await bcrypt.compare(input.password, user.passwordHash);
  126: if (!isValid) {
  127:   throw new UnauthorizedError("Invalid email or password");
  128: }
  ```
- **Recommended Fix**: Add structured audit logging on failed authentication attempts:
  ```typescript
  logger.warn({ event: "AUTH_LOGIN_FAILED", email: input.email, ip: ipAddress, userAgent }, "Failed authentication attempt");
  ```
- **Official Reference**: https://owasp.org/Top10/2025/A09_2025-Logging_and_Alerting_Failures/

---

### HIGH-10 — Route Guard Bypass on Internal Playground Route
- **File**: `apps/web/src/app/router/router.tsx:420-425` & `apps/web/src/config/navigation-registry.ts:46`
- **Severity**: High
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A01:2025 Broken Access Control
- **Description**: While `navigation-registry.ts` marks `/playground` with `permission: "settings:manage"`, the router definition in `router.tsx` mounts `<PlaygroundPage />` inside `ProtectedRoute` without a `PermissionGuard`. Any authenticated student or technician can navigate directly to `/playground` via URL or `Ctrl+K`.
- **Evidence**:
  ```tsx
  // router.tsx:420
  {
    path: "playground",
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <PlaygroundPage />
      </Suspense>
    ),
  }
  ```
- **Recommended Fix**: Wrap `PlaygroundPage` in `<PermissionGuard requiredPermissions={["settings:manage"]}>` or disable the route entirely in production builds (`import.meta.env.PROD`).
- **Official Reference**: https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/

---

### HIGH-11 — Missing Accessible Authentication Autocomplete Attributes
- **File**: `apps/web/src/features/auth/components/RegisterForm.tsx:60-110` & `LoginForm.tsx:53`
- **Severity**: High
- **Confidence**: High (Observed in source code)
- **Category**: WCAG 2.2 AA SC 3.3.8 Accessible Authentication / SC 1.3.5 Identify Input Purpose
- **Description**: The registration form inputs lack `autoComplete` attributes on `firstName`, `lastName`, `email`, `password`, and `confirmPassword`. The login form `email` field also lacks `autoComplete="username"` or `autoComplete="email"`. This prevents password managers and browser autofill from assisting users with cognitive disabilities, in direct violation of WCAG 2.2 Level AA.
- **Evidence**:
  ```tsx
  // RegisterForm.tsx:78-84
  <input type="email" placeholder="jane.doe@campus.edu" {...register("email")} ... />
  // No autoComplete="email"
  ```
- **Recommended Fix**: Add `autoComplete="given-name"`, `autoComplete="family-name"`, `autoComplete="email"`, and `autoComplete="new-password"` in `RegisterForm.tsx`, and `autoComplete="username"` on login email.
- **Official Reference**: https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html

---

### HIGH-12 — Widespread Focus Invisibility via `focus:outline-none` Without Replacement
- **File**: `apps/web/src/features/assets/pages/AssetsPage.tsx:952, 1012, 1023, 1031` & `AssetDetailPage.tsx:502-797`
- **Severity**: High
- **Confidence**: High (Observed across 143 instances via grep)
- **Category**: WCAG 2.2 AA SC 2.4.7 Focus Visible / SC 2.4.13 Focus Appearance
- **Description**: Over 140 interactive elements across the web client use `focus:outline-none` or `outline-none` without supplying a replacement `focus-visible:ring` or visible outline. When navigating by keyboard (`Tab`), focus indicators vanish completely on interactive buttons and table triggers.
- **Evidence**:
  ```tsx
  // AssetsPage.tsx:952
  className="font-mono font-bold text-xs text-primary hover:underline cursor-pointer focus:outline-none"
  // AssetsPage.tsx:1012
  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
  ```
- **Recommended Fix**: Replace all `focus:outline-none` with `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.
- **Official Reference**: https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html

---

### HIGH-13 — Missing Process-Level Unhandled Rejection Handlers
- **File**: `apps/api/src/server.ts:1-58`
- **Severity**: High
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A10:2025 Mishandling of Exceptional Conditions / ASVS 5.0.0 §7.1.1
- **Description**: `apps/api/src/server.ts` handles `SIGTERM` and `SIGINT`, but defines no listeners for `unhandledRejection` or `uncaughtException`. Any asynchronous error thrown inside background schedulers (`startPrivilegeScheduler`, `startTechnicianAvailabilityScheduler`), Socket.IO event handlers, or domain event listeners will terminate the Node.js process without graceful recovery.
- **Evidence**: Grep reveals zero `process.on('unhandledRejection')` across `apps/api`.
- **Recommended Fix**: Add global rejection handlers in `apps/api/src/server.ts`:
  ```typescript
  process.on("unhandledRejection", (reason) => {
    logger.fatal({ err: reason }, "Unhandled Promise Rejection detected");
    process.exit(1);
  });
  process.on("uncaughtException", (error) => {
    logger.fatal({ err: error }, "Uncaught Exception detected");
    process.exit(1);
  });
  ```
- **Official Reference**: https://owasp.org/Top10/2025/A10_2025-Mishandling_of_Exceptional_Conditions/

---

### HIGH-14 — Missing Express `trust proxy` Setting
- **File**: `apps/api/src/app.ts:15-20`
- **Severity**: High
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A02:2025 Security Misconfiguration / OWASP A01:2025 Broken Access Control
- **Description**: `apps/api/src/app.ts` does not call `app.set('trust proxy', 1)`. When deployed behind reverse proxies (Docker, Render, Kubernetes, Nginx), `req.ip` returns the internal proxy IP rather than the client's public IP. This causes `express-rate-limit` to group all incoming requests into one shared bucket, leading to premature rate-limiting of legitimate users.
- **Evidence**: Grep confirms `app.set("trust proxy", ...)` is absent in `app.ts`.
- **Recommended Fix**: Add `app.set("trust proxy", 1);` in `apps/api/src/app.ts` before rate limiter and logger middleware.
- **Official Reference**: https://expressjs.com/en/guide/behind-proxies.html

---

### MED-01 — Orphaned Feature: Automation System Unreachable in Web UI
- **File**: `apps/web/src/features/automation/pages/AutomationPage.tsx`
- **Severity**: Medium
- **Confidence**: High (Observed in source code)
- **Category**: Architecture & Flow Scope
- **Description**: `AutomationPage.tsx` is a 1,006-line feature component, backed by `apps/api/src/modules/automation/`. However, it is never imported or mounted in `apps/web/src/app/router/router.tsx` and does not appear in `apps/web/src/config/navigation-registry.ts`. The feature is completely orphaned and inaccessible to end users.
- **Evidence**: Grep for `AutomationPage` reveals it is only imported by its own `index.ts`.
- **Recommended Fix**: Register `/automation` route in `router.tsx` protected by `PermissionGuard requiredPermissions={["settings:manage"]}` and add the entry to `NAVIGATION_REGISTRY`.
- **Official Reference**: Architecture Design Review Standards

---

### MED-02 — Massive Monolithic Page Components (>1,000 to >2,400 LOC)
- **File**: `apps/web/src/features/assets/pages/AssetsPage.tsx:1-2417`
- **Severity**: Medium
- **Confidence**: High (Observed via line count tool)
- **Category**: Code Quality & Bloat Candidate
- **Description**: Multiple page components exceed 1,000 lines of code, with `AssetsPage.tsx` reaching 2,416 lines, `InventoryPage.tsx` reaching 1,998 lines, and `AssetDetailPage.tsx` reaching 1,449 lines. These files contain embedded forms, modals, print styles, and table columns in single monolithic components, violating separation of concerns and degrading maintainability.
- **Evidence**:
  - `apps/web/src/features/assets/pages/AssetsPage.tsx`: 2,416 lines
  - `apps/web/src/features/inventory/pages/InventoryPage.tsx`: 1,998 lines
  - `apps/web/src/features/assets/pages/AssetDetailPage.tsx`: 1,449 lines
  - `apps/web/src/features/maintenance/pages/MaintenancePage.tsx`: 1,160 lines
  - `apps/web/src/lib/repositories/inventory.repository.ts`: 1,143 lines
  - `apps/web/src/features/automation/pages/AutomationPage.tsx`: 1,006 lines
- **Recommended Fix**: Extract embedded modal dialogs (`AssetCreateDialog`, `PrintQRCodesModal`, `ColumnVisibilityMenu`) into dedicated files under `features/assets/components/`.
- **Official Reference**: https://martinfowler.com/bliki/CodeSmell.html

---

### MED-03 — Over 80 Orphaned Scaffolding Placeholder Files
- **File**: `apps/web/src/features/*/components/index.ts`, `services/index.ts`, `hooks/index.ts`
- **Severity**: Medium
- **Confidence**: High (Observed across 80+ files via grep)
- **Category**: Code Quality & Dead Code
- **Description**: The repository generator script scaffolded directories with empty placeholder files containing `export {}; // Placeholder for feature ...`. Over 80 files across 12 feature folders are empty stubs that add noise to the repository while monolithic pages house all logic directly.
- **Evidence**: 80+ matches for `// Placeholder for feature` across `apps/web/src/features/`.
- **Recommended Fix**: Remove empty placeholder files or populate them during component refactoring.
- **Official Reference**: Clean Architecture Best Practices

---

### MED-04 — Focus Obscured by Sticky Navbar (WCAG 2.4.11)
- **File**: `apps/web/src/components/navigation/Navbar.tsx:15`
- **Severity**: Medium
- **Confidence**: High (Observed in source code)
- **Category**: WCAG 2.2 AA SC 2.4.11 Focus Not Obscured (Minimum)
- **Description**: The top `Navbar` has `sticky top-0 z-30 h-12`. As users tab down the page or follow anchor links, elements receiving focus at the top of the container scroll underneath the sticky header. The codebase contains zero `scroll-margin-top` / `scroll-mt` classes to maintain focus clearance.
- **Evidence**:
  ```tsx
  15: <header className="sticky top-0 z-30 flex h-12 w-full items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-xs">
  ```
- **Recommended Fix**: Add global CSS rule in `apps/web/src/app/globals.css`:
  ```css
  :target, [tabindex]:focus, a:focus, button:focus, input:focus {
    scroll-margin-top: 4rem;
  }
  ```
- **Official Reference**: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html

---

### MED-05 — Interactive Table Rows Missing Keyboard Accessibility
- **File**: `apps/web/src/features/heatmap/pages/FloorDetailPage.tsx:195` & `RoomDetailPage.tsx:133`
- **Severity**: Medium
- **Confidence**: High (Observed in source code)
- **Category**: WCAG 2.2 AA SC 2.1.1 Keyboard Operability / SC 4.1.2 Name, Role, Value
- **Description**: Table rows implement click-to-navigate with `cursor-pointer`, but have no `tabIndex={0}`, `role="button"` or `role="link"`, and no `onKeyDown` listener (`Enter` / `Space`). Keyboard-only and assistive technology users cannot navigate to asset details from these tables.
- **Evidence**:
  ```tsx
  // FloorDetailPage.tsx:195
  <TableRow key={asset.id} className="hover:bg-muted/10 h-10 cursor-pointer" onClick={() => navigate(`/assets/${asset.id}`)}>
  ```
- **Recommended Fix**: Wrap the primary asset cell content in a semantic `<Link to={`/assets/${asset.id}`}>` or attach `tabIndex={0}`, `role="link"`, and an `onKeyDown` handler.
- **Official Reference**: https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html

---

### MED-06 — Inaccessible Mobile Drawer Overlay Dismissal
- **File**: `apps/web/src/app/layouts/AppLayout.tsx:58-62`
- **Severity**: Medium
- **Confidence**: High (Observed in source code)
- **Category**: WCAG 2.2 AA SC 2.1.1 Keyboard Operability / SC 1.3.1 Info and Relationships
- **Description**: The mobile backdrop overlay uses a non-semantic `<div>` with `onClick={() => setIsMobileOpen(false)}` and `aria-hidden="true"`. It cannot be focused or operated via keyboard, and there is no global `Escape` key listener on the overlay to close the mobile drawer.
- **Evidence**:
  ```tsx
  58: <div
  59:   onClick={() => setIsMobileOpen(false)}
  60:   className="fixed inset-0 z-30 bg-background/80 backdrop-blur-xs lg:hidden transition-all duration-150"
  61:   aria-hidden="true"
  62: />
  ```
- **Recommended Fix**: Add an `Escape` key event listener in `AppLayout.tsx` to close `isMobileOpen` when active.
- **Official Reference**: https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html

---

### MED-07 — Leaked Temporary Files on Upload Failure (Disk Exhaustion)
- **File**: `apps/api/src/modules/assets/assets.controller.ts:372-375` & `apps/api/src/modules/inventory/controllers/inventory.controller.ts:340-344`
- **Severity**: Medium
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A10:2025 Mishandling of Exceptional Conditions / OWASP A08:2025 Data Integrity Failures
- **Description**: Multer saves uploaded files to the `uploads/` directory on disk. `fs.unlinkSync(file.path)` is called inside the `try` block after reading. If `fs.readFileSync` or `ImportExportHelper.parseBuffer` throws (e.g. malformed CSV or corrupted XLSX), the execution jumps to `catch (err)` and the temporary upload file is never deleted, leading to unbounded disk exhaustion.
- **Evidence**:
  ```typescript
  // AssetsController.ts:372
  const buffer = fs.readFileSync(file.path);
  const rows = ImportExportHelper.parseBuffer(buffer);
  fs.unlinkSync(file.path); // Never executed if parseBuffer throws!
  ```
- **Recommended Fix**: Move file cleanup into a `finally` block or wrap in safe unlinking utility:
  ```typescript
  try {
    const buffer = fs.readFileSync(file.path);
    const rows = ImportExportHelper.parseBuffer(buffer);
  } finally {
    if (file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
  ```
- **Official Reference**: https://owasp.org/Top10/2025/A10_2025-Mishandling_of_Exceptional_Conditions/

---

### MED-08 — Error Handler Omits Correlation Request-ID in Client Responses
- **File**: `apps/api/src/middleware/error-handler.ts:73-79`
- **Severity**: Medium
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A09:2025 Logging & Alerting Failures / Production Readiness
- **Description**: While `pinoHttp` generates a `req.id` via `requestId` middleware, `errorHandler` returns generic 500 error objects `{ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "..." } }` without including the request ID. When users report incidents, support teams have no correlation ID to trace the error in backend logs.
- **Evidence**:
  ```typescript
  73: res.status(500).json({
  74:   success: false,
  75:   error: {
  76:     code: "INTERNAL_SERVER_ERROR",
  77:     message: "An unexpected error occurred on the server"
  78:   }
  79: });
  ```
- **Recommended Fix**: Include `requestId: req.id` in all error responses:
  ```typescript
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred on the server",
      requestId: req.id
    }
  });
  ```
- **Official Reference**: https://owasp.org/Top10/2025/A09_2025-Logging_and_Alerting_Failures/

---

### MED-09 — Missing Password Complexity and Bcrypt DoS Protection
- **File**: `packages/shared-schemas/src/auth.ts:10-25`
- **Severity**: Medium
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A07:2025 Authentication Failures / OWASP A06:2025 Insecure Design
- **Description**: `registerSchema` and `changePasswordSchema` lack maximum password length limits and do not require special characters. Extremely long password inputs (e.g., 100,000 characters) sent to `bcrypt.hash(password, 12)` cause CPU exhaustion (Bcrypt DoS), while bcrypt silently truncates passwords beyond 72 bytes.
- **Evidence**:
  ```typescript
  13: password: z.string()
  14:   .min(8, "Password must be at least 8 characters long")
  15:   .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  16:   .regex(/[0-9]/, "Password must contain at least one number"),
  ```
- **Recommended Fix**: Add `.max(72, "Password must not exceed 72 characters")` and `.regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character")`.
- **Official Reference**: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

---

### MED-10 — Incomplete ESLint Configuration Omits TypeScript, React, and Security Rules
- **File**: `eslint.config.js:1-24`
- **Severity**: Medium
- **Confidence**: High (Observed in source code)
- **Category**: Code Quality & Build Governance
- **Description**: `eslint.config.js` only configures `@eslint/js` base rules with `no-undef: "off"`. It contains no parser or plugins for `@typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, or `eslint-plugin-security`. Consequently, linting produces zero errors despite 165 compilation bugs and accessibility antipatterns.
- **Evidence**:
  ```javascript
  15: js.configs.recommended,
  16: {
  17:   rules: {
  18:     "no-unused-vars": "warn",
  19:     "no-console": "off",
  20:     "no-undef": "off"
  21:   }
  22: }
  ```
- **Recommended Fix**: Configure `@typescript-eslint/eslint-plugin`, `eslint-plugin-react-hooks`, and `eslint-plugin-jsx-a11y` in the flat config.
- **Official Reference**: https://eslint.org/docs/latest/use/configure/configuration-files-new

---

### MED-11 — Absence of Automated CI/CD Pipelines and SBOM Generation
- **File**: Repository Root (no `.github/workflows/` directory)
- **Severity**: Medium
- **Confidence**: High (Observed via file tree search)
- **Category**: OWASP A03:2025 Software Supply Chain Failures / ASVS 5.0.0 §14.2.1
- **Description**: The repository contains no `.github/workflows` or CI/CD configuration. There are no automated pull request checks for typechecking, linting, tests, dependency security audits, or Software Bill of Materials (SBOM) generation.
- **Evidence**: Search confirms no `.github/workflows` folder exists in the workspace.
- **Recommended Fix**: Add `.github/workflows/ci.yml` running `pnpm audit`, `pnpm typecheck`, `pnpm lint`, and CycloneDX SBOM generation on all pull requests.
- **Official Reference**: https://owasp.org/Top10/2025/A03_2025-Software_Supply_Chain_Failures/

---

### LOW-01 — Interactive Target Size Violations Below 24×24px (WCAG 2.5.8)
- **File**: `apps/web/src/features/assets/pages/AssetsPage.tsx:1012, 1023, 1031`
- **Severity**: Low
- **Confidence**: High (Observed in source code)
- **Category**: WCAG 2.2 AA SC 2.5.8 Target Size (Minimum)
- **Description**: Action icon buttons in table rows use `p-1` with 12px/14px icons, providing clickable bounding areas under 24×24 CSS pixels without sufficient spacing.
- **Evidence**: `<button className="p-1 hover:bg-muted rounded text-muted-foreground ...">`
- **Recommended Fix**: Enforce `min-h-[24px] min-w-[24px] flex items-center justify-center` on all icon action buttons.
- **Official Reference**: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

---

### LOW-02 — Missing Subresource Integrity (SRI) on External CDN Assets
- **File**: `apps/api/src/app.ts:31-32`
- **Severity**: Low
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A08:2025 Data Integrity Failures / ASVS 5.0.0 §14.3.3
- **Description**: The CSP allows `https://cdn.jsdelivr.net` for script and image loading, but Subresource Integrity (`integrity="sha384-..."`) is not mandated. If the CDN is compromised, modified scripts could be loaded.
- **Evidence**: `"script-src": ["'self'", "https://cdn.jsdelivr.net"]` without hash enforcement.
- **Recommended Fix**: Bundle all third-party dependencies locally or enforce strict SRI hashes.
- **Official Reference**: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity

---

### LOW-03 — Naming Inconsistency in Permission Constants
- **File**: `packages/constants/src/permissions.ts:231`
- **Severity**: Low
- **Confidence**: High (Observed in source code)
- **Category**: Architecture & Consistency
- **Description**: While all permissions adhere to `domain:action` (colon-delimited, e.g. `tickets:create`, `assets:read`), service status uses `service_status.manage` (underscore and dot).
- **Evidence**: `code: "service_status.manage"` in `PERMISSION_REGISTRY`.
- **Recommended Fix**: Rename code to `service-status:manage` or alias it for consistency across backend and frontend registries.
- **Official Reference**: API Style Guidelines

---

### LOW-04 — Root `package.json` Missing `"type": "module"` Warning
- **File**: `package.json:1-26`
- **Severity**: Low
- **Confidence**: High (Observed during ESLint run)
- **Category**: Node.js Best Practices
- **Description**: Running `pnpm lint` triggers Node.js warning `MODULE_TYPELESS_PACKAGE_JSON` because root `package.json` does not declare `"type": "module"`.
- **Evidence**: Node warning output during `pnpm lint`.
- **Recommended Fix**: Add `"type": "module"` to root `package.json`.
- **Official Reference**: https://nodejs.org/api/packages.html#type

---

### LOW-05 — Unused Password Reset Mail Template Without Backend Endpoint
- **File**: `apps/api/src/modules/mail/templates/password-reset.hbs`
- **Severity**: Low
- **Confidence**: High (Observed in source code)
- **Category**: Flow & Scope
- **Description**: An email template `password-reset.hbs` exists in `apps/api/src/modules/mail/templates/`, but no `/auth/forgot-password` or `/auth/reset-password` endpoint is implemented in `auth.routes.ts`.
- **Evidence**: Grep shows no router definition for password reset endpoints.
- **Recommended Fix**: Implement the password reset flow or remove the orphaned template to prevent user confusion.
- **Official Reference**: Application Flow Review

---

### LOW-06 — Insecure Development Fallback Secrets in `.env.example`
- **File**: `.env.example:18-19` & `apps/api/.env.example:12-13`
- **Severity**: Low
- **Confidence**: High (Observed in source code)
- **Category**: OWASP A02:2025 Security Misconfiguration
- **Description**: Root `.env.example` provides explicit mock secrets (`cc_access_secret_key_change_me_in_production_12345678`) that developers might copy directly to production environments.
- **Evidence**: `.env.example` lines 18-19.
- **Recommended Fix**: Use placeholder markers `<GENERATE_RANDOM_SECRET_MIN_32_CHARS>` with deployment validation failing on unchanged defaults.
- **Official Reference**: https://owasp.org/Top10/2025/A02_2025-Security_Misconfiguration/

---

## Clean Areas
The following areas were systematically audited and found compliant:
1. **Parameterized Database Queries (No SQLi)**: All database interactions utilize Prisma ORM with parameterized inputs. No instances of `$queryRawUnsafe`, `$executeRawUnsafe`, or string concatenation in SQL queries were identified.
2. **Safe Code Execution**: No usages of `eval()`, `new Function()`, `execSync`, `child_process`, or Python deserializers (`pickle.load`, `yaml.load`) exist in the codebase.
3. **Password Storage Hashing**: User passwords are encrypted using `bcrypt` with salt rounds set to 12 (`bcrypt.hash(password, 12)`).
4. **JWT Algorithm Pinning**: Token verification in `authenticate.ts:35` explicitly enforces `algorithms: ["HS256"]`, preventing algorithm confusion attacks (`none` or RSA/HMAC switching).
5. **Scoped Ticket Authorization**: `TicketsController` enforces rigorous scope checking (`OWN`, `ASSIGNED`, `ALL`), preventing unauthorized student access to tickets submitted by other users.
6. **Form Label Association**: The reusable `FormField` component automatically associates form labels with child inputs using React `useId()`, `htmlFor`, and `aria-describedby` with polite error announcements.
7. **Client Skip Link**: An accessible skip link (`<a href="#main-content" className="skip-to-content">Skip to main content</a>`) is implemented in `AppLayout.tsx` and correctly anchors to `<main id="main-content">`.
8. **Offline Status Visual Indicator**: A persistent banner is displayed when network connection drops (`navigator.onLine === false`) in `AppLayout.tsx:50-54`, and IndexedDB offline queue automatically replays actions upon reconnection.

---

## Prioritized Fix List

1. **CRIT-01**: Fix Prisma 7 `@prisma/client` import namespace errors across `apps/api` to unblock `pnpm -r build`.
2. **CRIT-02**: Install `dompurify` and sanitize `article.content` in `ArticlePage.tsx:143` to eliminate Stored XSS.
3. **CRIT-03**: Remove default password fallback `"CampusCare123!"` in `users.service.ts:126` and require explicit passwords or email invitations.
4. **CRIT-04**: Add pnpm override for `proxy-addr: "^2.0.8"` to remediate critical IP-spoofing vulnerability CVE-2023-26160.
5. **CRIT-05**: Upgrade `axios` to `>=1.20.0` in `apps/web/package.json` to remediate 8 high-severity CVEs.
6. **CRIT-06**: Strip the mock adapter layer and SYSTEM_ADMIN mock impersonation from production web builds.
7. **CRIT-07**: Purge backend database and JWT signing secrets from `apps/web/.env` and `apps/web/.env.example`.
8. **HIGH-01**: Mount `generalRateLimit` in `apps/api/src/app.ts` on `/api/v1`.
9. **HIGH-02**: Attach `authRateLimit` to `authRouter.post("/register")`.
10. **HIGH-03**: Mount `hydrateTemporaryPermissions` globally so privilege revocations apply across `/tickets`, `/assets`, and `/inventory`.
11. **HIGH-04**: Restrict role modification in `users.service.ts`, prevent self-escalation, and revoke all sessions on role update.
12. **HIGH-05**: Implement CSRF mitigation and origin validation on state-changing API endpoints.
13. **HIGH-06**: Add HSTS header configuration (`maxAge: 31536000`) in Helmet in `app.ts`.
14. **HIGH-07**: Add file size limits (5MB) and MIME-type filters to Multer in `assets.routes.ts` and `inventory.routes.ts`.
15. **HIGH-08**: Escape formula trigger characters (`=`, `+`, `-`, `@`) in `ImportExportHelper.generateExport`.
16. **HIGH-09**: Implement audit logging for failed login attempts in `auth.service.ts`.
17. **HIGH-10**: Protect `/playground` in `router.tsx` with `PermissionGuard` or disable it in production.
18. **HIGH-11**: Add missing `autoComplete` attributes in `RegisterForm.tsx` and `LoginForm.tsx` (WCAG 3.3.8).
19. **HIGH-12**: Replace `focus:outline-none` with visible focus indicators (`focus-visible:ring-2`) across 143 UI elements.
20. **HIGH-13**: Add `process.on('unhandledRejection')` and `process.on('uncaughtException')` in `apps/api/src/server.ts`.
21. **HIGH-14**: Call `app.set('trust proxy', 1)` in `apps/api/src/app.ts`.
22. **MED-01**: Register `/automation` in `router.tsx` and `NAVIGATION_REGISTRY` or archive the orphaned module.
23. **MED-02**: Refactor monolithic pages (`AssetsPage.tsx`, `InventoryPage.tsx`) into subcomponents under 300 LOC.
24. **MED-03**: Clean up over 80 empty scaffolding placeholder files.
25. **MED-04**: Add global `scroll-margin-top: 4rem` to eliminate sticky header focus obscuring (WCAG 2.4.11).
26. **MED-05**: Add keyboard support and links to clickable `TableRow` elements in Heatmap detail views (WCAG 2.1.1).
27. **MED-06**: Add keyboard dismissal for the mobile drawer overlay in `AppLayout.tsx`.
28. **MED-07**: Move temporary uploaded file deletion into `finally` blocks in `assets.controller.ts` and `inventory.controller.ts`.
29. **MED-08**: Include `requestId` in client-facing 500 responses in `error-handler.ts`.
30. **MED-09**: Constrain password length (`max(72)`) in Zod schemas to prevent Bcrypt DoS.
31. **MED-10**: Configure TypeScript, React Hooks, and A11y rules in `eslint.config.js`.
32. **MED-11**: Establish GitHub Actions CI pipeline with automated testing, linting, and SBOM generation.
33. **LOW-01** to **LOW-06**: Fix sub-24px icon targets, add SRI hashes, normalize permission strings, add `"type": "module"` to root package, and clean `.env.example` defaults.

---

## Verification Required
The following items require runtime environment verification:
1. **F020 / Manual Screen Reader Verification**: While semantic elements and ARIA roles were audited via static analysis, a live session with NVDA/VoiceOver is recommended to verify dialog focus trapping when modals (e.g. `TemporaryAccessWorkspace`, `UserFormDialog`) open and close.
2. **Reverse Proxy TLS Offloading Verification**: Confirm that the production deployment environment (Render / Docker reverse proxy) forwards `X-Forwarded-Proto: https` so that Helmet HSTS and cookie `secure` flags activate as intended.
