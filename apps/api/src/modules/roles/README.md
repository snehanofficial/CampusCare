# Roles Module

This is the Express backend module for roles.

## Conventions
- Routes are explicitly mounted under `/api/v1/roles`.
- Business operations are placed inside `roles.service.ts` and call Prisma Client directly.
- Request parsing and payload handling is inside `roles.controller.ts`.
