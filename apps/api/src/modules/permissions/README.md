# Permissions Module

This is the Express backend module for permissions.

## Conventions
- Routes are explicitly mounted under `/api/v1/permissions`.
- Business operations are placed inside `permissions.service.ts` and call Prisma Client directly.
- Request parsing and payload handling is inside `permissions.controller.ts`.
