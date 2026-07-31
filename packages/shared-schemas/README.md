# @campuscare/shared-schemas

This package contains shared validation schemas (using Zod) for authentication, ticketing, asset creation, and inventory updates.

## Conventions
- Use camelCase for Zod schema names (e.g. `loginSchema`).
- Export both the Zod schema and its TypeScript type (inferred via `z.infer`).
- Restrict schemas to pure validation without business logic or side effects.
