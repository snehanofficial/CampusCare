# Settings Module

This is the Express backend module for settings.

## Conventions
- Routes are explicitly mounted under `/api/v1/settings`.
- Business operations are placed inside `settings.service.ts` and call Prisma Client directly.
- Request parsing and payload handling is inside `settings.controller.ts`.
