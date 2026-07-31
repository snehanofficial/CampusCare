# Maintenance Module

This is the Express backend module for maintenance.

## Conventions
- Routes are explicitly mounted under `/api/v1/maintenance`.
- Business operations are placed inside `maintenance.service.ts` and call Prisma Client directly.
- Request parsing and payload handling is inside `maintenance.controller.ts`.
