# Audit Module

This is the Express backend module for audit.

## Conventions
- Routes are explicitly mounted under `/api/v1/audit`.
- Business operations are placed inside `audit.service.ts` and call Prisma Client directly.
- Request parsing and payload handling is inside `audit.controller.ts`.
