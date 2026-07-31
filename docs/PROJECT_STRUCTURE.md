# Project Structure - CampusCare

This document details the folder structure and feature layout of the monorepo.

## Monorepo Layout

```text
campuscare/
├── apps/
│   ├── web/                     # React Frontend Application
│   │   ├── src/
│   │   │   ├── app/             # Application entry providers & styles
│   │   │   ├── components/      # Global shared UI components
│   │   │   ├── features/        # Self-contained domain-driven features
│   │   │   └── main.tsx
│   │   └── package.json
│   │
│   └── api/                     # Express Backend Application
│       ├── src/
│       │   ├── app.ts
│       │   ├── server.ts
│       │   ├── database/        # Prisma client setup
│       │   └── modules/         # Explicitly registered domain modules
│       ├── prisma/              # Single, stable Prisma schema file
│       └── package.json
│
├── packages/                    # Local workspace dependencies
│   ├── shared-types/            # Shared TypeScript interfaces
│   ├── shared-schemas/          # Shared Zod validation schemas
│   ├── shared-utils/            # Shared formatting helpers
│   └── constants/               # Domain constants (roles, statuses)
```

## Feature/Module Conventions

### Frontend Features (`apps/web/src/features/<feature_name>/`)
Every folder inside features is structured consistently:
- `components/` - Sub-components specific to this feature.
- `hooks/` - Feature-specific React hooks.
- `pages/` - Views mapped directly to routes.
- `services/` - TanStack Query hook definitions calling the API.
- `types/` - Client-side definitions.
- `README.md` - Module description.
- `index.ts` - Exposed exports.

### Backend Modules (`apps/api/src/modules/<module_name>/`)
- `routes/` or `<module>.routes.ts` - Route definitions.
- `<module>.controller.ts` - Request/response mapping.
- `<module>.service.ts` - Business logic and database actions.
- `index.ts` - Barrel exports.
- `README.md` - Module description.
