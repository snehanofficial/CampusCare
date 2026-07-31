# Module Boundaries & Dependency Rules

This document outlines the architectural boundaries and strict dependency rules enforced across the **CampusCare** monorepo workspace to ensure type safety, avoid circular imports, and maintain testability.

## Monorepo Dependency Rules

To prevent code leaks and circular imports, the following dependency rules must be strictly followed:

- **Apps to Packages:** `apps/web` and `apps/api` are allowed to import from packages (`packages/shared-types`, `packages/shared-schemas`, `packages/shared-utils`, `@campuscare/constants`).
- **Packages to Apps:** Shared packages must NEVER import code, types, or utilities from the application directories (`apps/web` or `apps/api`). Packages must be completely standalone.
- **Packages to Packages:**
  - `packages/shared-schemas` may import types from `packages/shared-types`.
  - Packages should never import from `apps/*`.

## Architectural Boundaries (Backend)

```
[Request] → [Route Layer] → [Controller Layer] → [Service Layer] → [Prisma Client] → [Database]
```

1. **Routing Layer:**
   - Must only handle route paths, mounting, and documentation definitions.
   - Must not contain business logic or database queries.

2. **Controller Layer:**
   - Decoupled from Express routers to simplify mock testing.
   - Communicates strictly with Services.
   - Never calls database (Prisma) methods directly.

3. **Service Layer:**
   - Houses core business validations, domain events, and state mutations.
   - Interacts directly with the singleton database client (`prisma`).
   - Does not access HTTP requests (`req`), headers, or cookies.

## Feature Boundaries (Frontend)

- **Feature Separation:** The directories under `apps/web/src/features/*` represent self-contained domains (e.g. `tickets`, `inventory`).
- **Cross-Feature Imports:** A feature may import from another feature's exposed service api or types, but must NEVER import components directly from another feature's internal folders. Shared components must reside in the root `components/` directory (e.g. `components/ui`, `components/common`).
