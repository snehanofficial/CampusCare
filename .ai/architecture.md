# AI Architecture Reference

This is a developer reference sheet for AI agents modifying the **CampusCare** codebase.

## Backend Core
- **Framework:** Express.js (v5)
- **Path Aliases:** Use relative imports with the `.js` extension (e.g. `import { service } from "./service.js"`).
- **Prisma Integration:** Do not write SQL queries. Do not create repository classes. Query Prisma client methods directly from inside Service classes.
- **Errors:** Throw pre-defined custom errors from `utils/errors.ts` (e.g. `NotFoundError`). The global middleware catches them and returns the standardized response envelope.

## Frontend Core
- **Framework:** React 19 + Vite 8
- **Path Aliases:** Always use absolute aliases starting with `@/` to import layouts, services, or common components.
- **Styling:** Design tokens are located inside `globals.css` using Tailwind CSS v4 variables mapping.
- **Query Mutators:** Use TanStack Query custom hook definitions under `services/` for mutations.
