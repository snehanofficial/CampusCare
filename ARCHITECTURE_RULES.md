# Architecture Rules

These rules are enforced across the **CampusCare** codebase. Do not deviate from these patterns:

1. **Workspace Decoupling & Boundaries:**
   - Applications (`apps/*`) may depend on shared packages (`packages/*`).
   - Packages must NEVER depend on applications.
   - Cross-package dependencies are allowed only from schemas/utils to types.

2. **Backend Structure (Service-Prisma):**
   - Do not use Repository classes. Service classes access the Prisma client singleton (`prisma`) directly.
   - All HTTP requests, cookie parsing, and output formatting must be isolated within the Controller layer.
   - Routes must be explicitly registered inside `apps/api/src/modules/index.ts`. No dynamic directory scanning.

3. **Database Conventions:**
   - All PostgreSQL tables and columns must use `snake_case`.
   - All TypeScript class variables and properties must use `camelCase`.
   - Mappings are declared in `prisma/schema.prisma` using `@map` and `@@map`.
