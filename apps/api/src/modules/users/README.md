# Users Module

This is the Express backend module for users.

## Conventions
- Routes are explicitly mounted under `/api/v1/users`.
- Business operations are placed inside `users.service.ts` and call Prisma Client directly.
- Request parsing and payload handling is inside `users.controller.ts`.
