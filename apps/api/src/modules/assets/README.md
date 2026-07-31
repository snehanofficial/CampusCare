# Assets Module

This is the Express backend module for assets.

## Conventions
- Routes are explicitly mounted under `/api/v1/assets`.
- Business operations are placed inside `assets.service.ts` and call Prisma Client directly.
- Request parsing and payload handling is inside `assets.controller.ts`.
