# Sla Module

This is the Express backend module for sla.

## Conventions
- Routes are explicitly mounted under `/api/v1/sla`.
- Business operations are placed inside `sla.service.ts` and call Prisma Client directly.
- Request parsing and payload handling is inside `sla.controller.ts`.
