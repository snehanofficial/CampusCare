# Reports Module

This is the Express backend module for reports.

## Conventions
- Routes are explicitly mounted under `/api/v1/reports`.
- Business operations are placed inside `reports.service.ts` and call Prisma Client directly.
- Request parsing and payload handling is inside `reports.controller.ts`.
