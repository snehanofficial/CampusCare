# PROJECT_CONVENTIONS.md
## CampusCare — Project Conventions & Engineering Standards

> **Status:** Phase 1 Implementation Reference  
> **Scope:** All developers, all modules, all phases  
> **Toolchain:** TypeScript 7 · ESLint · Prettier · Husky · lint-staged · pnpm Workspaces

---

## 1. Purpose

This document is the single source of truth for project-wide conventions. Every developer and AI assistant working on CampusCare must follow these standards. No exceptions without team discussion.

---

## 2. TypeScript Configuration

### Base `tsconfig.base.json` (root)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "paths": {}
  }
}
```

**Key flags explained:**
- `strict: true` — enables all strict mode checks
- `noUncheckedIndexedAccess` — `array[0]` returns `T | undefined`, preventing runtime crashes
- `exactOptionalPropertyTypes` — distinguishes `prop?: string` from `prop: string | undefined`
- `verbatimModuleSyntax` — requires `import type` for type-only imports (cleaner, faster)
- `isolatedModules` — ensures each file can be compiled independently (required for Vite)

### TypeScript Rules

❌ **Never use `any`**
```typescript
// Bad
const data: any = apiResponse;

// Good
const data: ApiSuccessResponse<Ticket[]> = apiResponse;

// Acceptable escape hatch (with comment explaining why)
const legacyData = externalLib.getData() as unknown as LegacyFormat;
```

❌ **No non-null assertions (`!`) without justification**
```typescript
// Bad
const user = getUser()!;

// Good
const user = getUser();
if (!user) throw new UnauthorizedError();
```

✅ **Always use `import type` for type-only imports**
```typescript
import type { Ticket, User } from "@campuscare/shared-types";
import { ticketsApi } from "./tickets.api";
```

---

## 3. File & Folder Naming Conventions

| Item | Convention | Example |
|:---|:---|:---|
| React components | `PascalCase.tsx` | `TicketDetailPage.tsx` |
| Hooks | `camelCase.ts` with `use` prefix | `useTickets.ts` |
| API files | `camelCase.api.ts` | `tickets.api.ts` |
| Utilities | `camelCase.ts` | `date-formatter.ts` |
| Types files | `camelCase.ts` | `ticket.types.ts` |
| Feature directories | `kebab-case` | `features/knowledge-base/` |
| Backend modules | `kebab-case` | `modules/ticket-comments/` |
| Backend files | `module.layer.ts` | `auth.service.ts`, `auth.controller.ts` |

---

## 4. Component Conventions

### Export Style
Always use **named exports** — never default exports for components:

```typescript
// ✅ Correct
export function TicketCard({ ticket }: TicketCardProps) { ... }

// ❌ Wrong
export default function TicketCard() { ... }
```

**Why?** Named exports enable better tree-shaking, more consistent imports, and better IDE refactoring support.

### Props Interface
Every component has a typed `Props` interface:

```typescript
// Interface name = ComponentName + "Props"
interface TicketCardProps {
  ticket: Ticket;
  onAssign?: (ticketId: string) => void;
  isLoading?: boolean;
  className?: string;  // Always accept className for composition
}
```

### Component File Structure
```typescript
// 1. Type imports
import type { ComponentPropsWithoutRef } from "react";
import type { Ticket } from "@campuscare/shared-types";

// 2. Library imports
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

// 3. Internal imports (absolute, using @ alias)
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/hooks/useAuth";

// 4. Props interface
interface Props { ... }

// 5. Component function
export function ComponentName({ prop1, prop2 }: Props) {
  // 5a. Hooks first
  // 5b. Derived state / computations
  // 5c. Event handlers (useCallback for handlers passed as props)
  // 5d. Return JSX
}
```

---

## 5. Import Conventions

Use **absolute imports** with the `@` alias for all project-internal imports. Relative imports only for files in the same directory.

```typescript
// ✅ Absolute (preferred)
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { Ticket } from "@campuscare/shared-types";

// ✅ Relative (same directory only)
import { TicketCard } from "./TicketCard";
import type { TicketCardProps } from "./TicketCard";

// ❌ Deep relative (never)
import { Button } from "../../../components/ui/button";
```

### Import Order (enforced by ESLint)
1. Type imports (`import type`)
2. External libraries (`react`, `axios`, etc.)
3. Internal packages (`@campuscare/shared-types`)
4. Internal application (`@/...`)
5. Relative imports (`./...`)

---

## 6. Feature Module Structure

Every feature in `apps/web/src/features/` follows this exact structure:

```
feature-name/
├── api/
│   ├── feature.api.ts     # Axios calls
│   └── query-keys.ts      # TanStack Query key factories
├── components/
│   └── FeatureComponent.tsx
├── hooks/
│   ├── useFeatureData.ts  # Query hooks
│   └── useFeatureMutation.ts
├── pages/
│   └── FeaturePage.tsx
├── schemas/
│   └── feature.schema.ts  # Local-only schemas (shared ones in packages/)
├── types/
│   └── feature.types.ts   # Local-only types
└── index.ts               # Public API of the feature
```

**`index.ts` rule:** Only export what other features need. Never export internal implementation details:
```typescript
// features/auth/index.ts
export { useAuth } from "./hooks/useAuth";
export { AuthProvider } from "./store/AuthProvider";
export type { AuthUser } from "./store/auth-context";
// NOT: export { authTokenStorage } (internal)
```

---

## 7. Backend Module Structure

Every module in `apps/api/src/modules/` follows:

```
module-name/
├── module.controller.ts   # HTTP layer: parse request, call service, send response
├── module.routes.ts       # Express Router: define routes + apply middleware
├── module.service.ts      # Business logic: Prisma calls, domain rules
├── module.dto.ts          # (Optional) Data Transfer Object types
└── index.ts               # Re-export router
```

**Layer responsibilities:**
- **Controller:** Only calls `req.body` (already validated), calls service, calls `sendSuccess(res, data)`, catches errors → `next(err)`
- **Service:** Business logic. No HTTP concepts (no `req`, no `res`). Throws `AppError` subclasses.
- **Routes:** Declares endpoints, applies `authenticate`, `authorize`, `validate` middlewares

---

## 8. API Endpoint Conventions

| Action | Method | Path Pattern | Example |
|:---|:---|:---|:---|
| List | `GET` | `/resource` | `GET /tickets` |
| Get one | `GET` | `/resource/:id` | `GET /tickets/abc123` |
| Create | `POST` | `/resource` | `POST /tickets` |
| Update (partial) | `PATCH` | `/resource/:id` | `PATCH /tickets/abc123` |
| Replace (full) | `PUT` | `/resource/:id` | `PUT /tickets/abc123` |
| Delete | `DELETE` | `/resource/:id` | `DELETE /tickets/abc123` |
| Sub-resource | `GET/POST` | `/resource/:id/sub` | `GET /tickets/abc123/comments` |

**URL casing:** Always `kebab-case` → `/knowledge-base`, `/sla-policies`

**Query parameters:** `camelCase` → `?page=1&limit=20&sortBy=createdAt&sortOrder=desc`

---

## 9. API Response Standards

All responses use the standard envelope:

```typescript
// Success
{
  "success": true,
  "data": { ... },         // Single resource OR array
  "meta": {                // Only for paginated lists
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",  // SCREAMING_SNAKE_CASE
    "message": "Ticket not found", // Human-readable
    "details": { ... }             // Optional: field-level errors
  }
}
```

---

## 10. Git Workflow

### Branch Strategy
```
main          → Production-ready code only
develop       → Integration branch
feature/*     → New features
fix/*         → Bug fixes
chore/*       → Tooling, dependencies, documentation
```

### Branch Naming
```
feat/auth-refresh-token
feat/ticket-list-filters
fix/sidebar-mobile-overlay
chore/update-dependencies
docs/api-authentication
```

### Commit Message Format (Conventional Commits)
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

**Examples:**
```
feat(auth): implement refresh token rotation with reuse detection
fix(sidebar): close mobile overlay on route change
docs(api): add authentication endpoint documentation
refactor(rbac): simplify permission check middleware
chore(deps): update @prisma/client to 7.9.1
```

---

## 11. Husky & lint-staged

Pre-commit hook runs automatically:

```json
// .lintstagedrc
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{css,md,json,yaml}": ["prettier --write"]
}
```

**Never bypass:** `git commit --no-verify` is not permitted. Fix lint errors before committing.

---

## 12. Code Quality Rules

### No TODO Comments in Committed Code
TODOs must be tracked as GitHub Issues, not left in code:
```typescript
// ❌ Bad
// TODO: Add pagination here later

// ✅ Good
// See GitHub Issue #42 for pagination implementation
```

### No Magic Numbers
```typescript
// ❌ Bad
setTimeout(callback, 900000);

// ✅ Good
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
setTimeout(callback, FIFTEEN_MINUTES_MS);
```

### Explicit Return Types on Service Methods
```typescript
// ✅ Always explicit in service layer
async login(input: LoginInput): Promise<LoginResult> { ... }

// ✅ OK for simple components where inference is obvious
export function TicketCard({ ticket }: TicketCardProps) { ... }
```

---

## 13. Shared Packages Usage

| Package | Contents | Import as |
|:---|:---|:---|
| `@campuscare/shared-types` | TypeScript interfaces (User, Ticket, etc.) | `import type { User } from "@campuscare/shared-types"` |
| `@campuscare/shared-schemas` | Zod schemas + inferred types | `import { loginSchema } from "@campuscare/shared-schemas"` |
| `@campuscare/shared-utils` | Pure utility functions | `import { formatDate } from "@campuscare/shared-utils"` |
| `@campuscare/constants` | System constants (ROLES, PERMISSIONS, etc.) | `import { ROLES } from "@campuscare/constants"` |

**Rule:** Never duplicate logic that belongs in a shared package. If both frontend and backend need it, it goes in shared packages.

---

## 14. Environment Variables

| Prefix | Scope | Example |
|:---|:---|:---|
| `VITE_` | Frontend only (exposed to browser) | `VITE_API_URL` |
| None | Backend only (never exposed) | `DATABASE_URL`, `JWT_ACCESS_SECRET` |

**Frontend env access:** `import.meta.env.VITE_API_URL`  
**Backend env access:** Always through `src/config/env.ts` (Zod-validated), never directly `process.env.VARIABLE`

```typescript
// apps/api/src/config/env.ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);
```

If any required variable is missing or invalid, the app fails at startup with a clear error message — not silently at runtime.

---

## 15. Testing Conventions

### Test File Location
```
# Unit tests: colocated with the file under test
src/features/auth/services/auth.service.ts
src/features/auth/services/auth.service.test.ts

# Integration tests
apps/api/tests/auth.integration.test.ts

# E2E tests (Phase 4)
tests/e2e/auth.spec.ts
```

### Test Naming
```typescript
describe("AuthService", () => {
  describe("login()", () => {
    it("should return accessToken and set refreshToken on valid credentials", async () => { });
    it("should throw UnauthorizedError on invalid credentials", async () => { });
    it("should throw UnauthorizedError when user account is disabled", async () => { });
  });
});
```

---

## 16. Documentation Standards

Every public API method must have a JSDoc comment:

```typescript
/**
 * Authenticates a user and returns a new token pair.
 *
 * @param input - The login credentials
 * @returns { user, accessToken, refreshToken }
 * @throws {UnauthorizedError} When credentials are invalid
 * @throws {ForbiddenError} When the account is disabled
 */
static async login(input: LoginInput): Promise<LoginResult>
```

Every feature module must have a `README.md` explaining:
- What the feature does
- Which files do what
- How to add a new field/endpoint to this feature
