# Analytics Module

This is the Express backend module for analytics.

## Conventions
- Routes are explicitly mounted under `/api/v1/analytics`.
- Business operations are placed inside `analytics.service.ts` and call Prisma Client directly.
- Request parsing and payload handling is inside `analytics.controller.ts`.
